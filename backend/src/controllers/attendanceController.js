'use strict';

const Attendance = require('../models/Attendance');
const HrEmployee = require('../models/HrEmployee');
const Leave = require('../models/Leave');
const { successResponse, errorResponse } = require('../utils/helpers');
const { enforceAutoLogout } = require('../utils/attendanceHelper');

/**
 * Helper: Auto check-out logic
 * If a record has checkIn but no checkOut and the time is past 7:00 PM,
 * we set checkOut to 7:00 PM and recalculate working hours.
 */

// POST /attendance/checkin
exports.checkIn = async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        const organizationId = req.user.organizationId;

        const existing = await Attendance.findOne({
            user: req.user._id,
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
            user: req.user._id,
            organizationId,
            date: now,
            checkIn: now,
            status,
            late
        });

        console.log("Attendance:", record);
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

        const record = await Attendance.findOne({
            user: req.user._id,
            date: { $gte: start, $lte: end }
        });

        if (!record) {
            return errorResponse(res, 'No check-in record found for today', 404);
        }
        if (record.checkOut) {
            return errorResponse(res, 'Already checked out', 400);
        }

        const now = new Date();
        record.checkOut = now;
        
        // Calculate working hours
        const diffMs = now - record.checkIn;
        const hours = diffMs / (1000 * 60 * 60);
        record.workingHours = Math.max(0, hours);

        // Half-day logic (keeping it as it was)
        if (hours < 4) {
            record.status = 'Half Day';
        }

        await record.save();
        console.log("Attendance:", record);
        return successResponse(res, record, 'Checked out successfully');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/my
exports.getMyAttendance = async (req, res) => {
    try {
        const user = req.user._id;
        const organizationId = req.user.organizationId;
        const records = await Attendance.find({ user, organizationId }).sort({ date: -1 });

        const processedRecords = await Promise.all(records.map(r => enforceAutoLogout(r)));
        console.log("Attendance:", processedRecords);
        return successResponse(res, processedRecords, 'Attendance log fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/stats
exports.getAttendanceStats = async (req, res) => {
    try {
        const user = req.user._id;
        const organizationId = req.user.organizationId;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        console.log("Start:", start);
        console.log("End:", end);

        const monthlyRecords = await Attendance.find({
            user,
            organizationId,
            date: { $gte: start, $lt: end }
        });
        
        await Promise.all(monthlyRecords.map(r => enforceAutoLogout(r)));

        // Statuses that count as presence
        const presentStatuses = ['Present', 'Late', 'Half Day'];
        const presentDays = monthlyRecords.filter(r => r.checkIn && presentStatuses.includes(r.status)).length;

        // Calculate working days in month so far
        let workingDays = 0;
        const todayDate = now.getDate();
        for (let d = 1; d <= todayDate; d++) {
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay(); 
            
            let isHoliday = false;
            if (dayOfWeek === 0) isHoliday = true; // Sunday
            if (dayOfWeek === 6) {
                // 2nd (8-14) or 4th (22-28) Saturday
                if ((d >= 8 && d <= 14) || (d >= 22 && d <= 28)) isHoliday = true;
            }

            if (!isHoliday) workingDays++;
        }

        const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

        const emp = await HrEmployee.findOne({ userId: user, organizationId });
        let monthlyLeaves = 0;
        let pendingRequests = 0;
        if (emp) {
            [monthlyLeaves, pendingRequests] = await Promise.all([
                Leave.countDocuments({
                    employeeId: emp._id,
                    organizationId,
                    $or: [
                        { startDate: { $lte: end }, endDate: { $gte: start } }
                    ],
                    status: 'approved'
                }),
                Leave.countDocuments({
                    employeeId: emp._id,
                    organizationId,
                    status: 'pending'
                })
            ]);
        }

        const data = {
            presentDays,
            workingDays,
            attendancePercentage: Math.round(attendancePercentage),
            monthlyLeaves,
            pendingRequests
        };

        console.log("Stats:", data);
        return successResponse(res, data, 'Attendance stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET /attendance/monthly
exports.getMonthlyChart = async (req, res) => {
    try {
        const user = req.user._id;
        const organizationId = req.user.organizationId;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        const records = await Attendance.find({
            user,
            organizationId,
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

        console.log("Chart Data:", chartData);
        return successResponse(res, chartData, 'Chart data fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};
