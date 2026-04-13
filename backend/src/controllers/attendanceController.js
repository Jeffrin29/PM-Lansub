'use strict';

const Attendance = require('../models/Attendance');
const HrEmployee = require('../models/HrEmployee');
const Leave = require('../models/Leave');
const { logActivity } = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { enforceAutoLogout } = require('../utils/attendanceHelper');

// POST /attendance/checkin
exports.checkIn = async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        const { organizationId, userId } = req.user;

        // Use ...req.orgFilter and req.user.userId
        const existing = await Attendance.findOne({
            user: userId,
            ...req.orgFilter,
            date: { $gte: start, $lte: end }
        });

        if (existing) {
            return errorResponse(res, 'Already checked in today', 400);
        }

        const now = new Date();
        const officeStartTime = new Date(today);
        officeStartTime.setHours(9, 30, 0, 0);
        
        let status = 'Present';
        const late = now > officeStartTime;
        if (late) status = 'Late';

        const record = await Attendance.create({
            user: userId,
            organizationId,
            date: now,
            checkIn: now,
            status,
            late
        });

        // ✅ LOG ACTIVITY
        await logActivity({
            userId: userId,
            organizationId,
            action: 'attendance:check-in',
            entityType: 'attendance',
            entityId: record._id,
            description: `Attendance check-in at ${now.toLocaleTimeString()}`
        });

        return successResponse(res, record, 'Checked in successfully');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// POST /attendance/checkout
exports.checkOut = async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        const { userId, organizationId } = req.user;
        const now = new Date();

        const record = await Attendance.findOne({
            user: userId,
            ...req.orgFilter,
            date: { $gte: start, $lte: end }
        });

        if (!record) {
            return errorResponse(res, 'No check-in record found for today', 404);
        }
        if (record.checkOut) {
            return errorResponse(res, 'Already checked out', 400);
        }

        record.checkOut = now;
        
        // Calculate working hours
        const diffMs = now - record.checkIn;
        const hours = diffMs / (1000 * 60 * 60);
        record.workingHours = Math.max(0, hours);

        if (hours < 4) {
            record.status = 'Half Day';
        }

        await record.save();

        // ✅ LOG ACTIVITY
        await logActivity({
            userId: userId,
            organizationId,
            action: 'attendance:check-out',
            entityType: 'attendance',
            entityId: record._id,
            description: `Attendance check-out at ${now.toLocaleTimeString()}`
        });

        return successResponse(res, record, 'Checked out successfully');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/my
exports.getMyAttendance = async (req, res) => {
    try {
        const { userId } = req.user;

        const filter = { 
            user: userId, 
            ...req.orgFilter 
        };

        const records = await Attendance.find(filter).sort({ date: -1 });
        const processedRecords = await Promise.all(records.map(r => enforceAutoLogout(r)));
        
        return successResponse(res, processedRecords || [], 'Attendance log fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/stats
exports.getAttendanceStats = async (req, res) => {
    try {
        const { userId, organizationId } = req.user;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        const monthlyRecords = await Attendance.find({
            user: userId,
            ...req.orgFilter,
            date: { $gte: start, $lt: end }
        });
        
        await Promise.all(monthlyRecords.map(r => enforceAutoLogout(r)));

        const presentStatuses = ['Present', 'Late', 'Half Day'];
        const presentDays = monthlyRecords.filter(r => r.checkIn && presentStatuses.includes(r.status)).length;

        let workingDays = 0;
        const todayDate = now.getDate();
        for (let d = 1; d <= todayDate; d++) {
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay(); 
            let isHoliday = (dayOfWeek === 0); // Sunday
            if (dayOfWeek === 6) {
                if ((d >= 8 && d <= 14) || (d >= 22 && d <= 28)) isHoliday = true;
            }
            if (!isHoliday) workingDays++;
        }

        const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

        const emp = await HrEmployee.findOne({ userId, ...req.orgFilter });
        let monthlyLeaves = 0;
        let pendingRequests = 0;
        if (emp) {
            [monthlyLeaves, pendingRequests] = await Promise.all([
                Leave.countDocuments({
                    employeeId: emp._id,
                    ...req.orgFilter,
                    $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
                    status: 'approved'
                }),
                Leave.countDocuments({
                    employeeId: emp._id,
                    ...req.orgFilter,
                    status: 'pending'
                })
            ]);
        }

        return successResponse(res, {
            presentDays,
            workingDays,
            attendancePercentage: Math.round(attendancePercentage),
            monthlyLeaves,
            pendingRequests
        }, 'Attendance stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/monthly
exports.getMonthlyChart = async (req, res) => {
    try {
        const { userId } = req.user;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        const records = await Attendance.find({
            user: userId,
            ...req.orgFilter,
            date: { $gte: start, $lt: end }
        }).lean();

        const recordMap = new Map(records.map(r => [new Date(r.date).toISOString().split('T')[0], r]));
        const chartData = [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay();

            let status = 'absent';
            const record = recordMap.get(dayStr);

            if (dayOfWeek === 0) {
                status = 'holiday';
            } else if (dayOfWeek === 6) {
                if ((d >= 8 && d <= 14) || (d >= 22 && d <= 28)) status = 'holiday';
            }

            if (record && record.checkIn) {
                status = record.status.toLowerCase();
            } else if (dayStr > now.toISOString().split('T')[0]) {
                status = 'pending';
            }

            chartData.push({ date: dayStr, status });
        }

        return successResponse(res, chartData || [], 'Chart data fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};
