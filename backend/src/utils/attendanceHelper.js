'use strict';

/**
 * Auto check-out logic
 * If a record has checkIn but no checkOut and the time is past 7:00 PM (19:00),
 * we set checkOut to 7:00 PM and recalculate working hours.
 */
const enforceAutoLogout = async (record) => {
    if (!record || record.checkOut || !record.checkIn) return record;

    const now = new Date();
    // Getting the date YYYY-MM-DD from record.date (which is a Date or string)
    const recordDate = new Date(record.date);
    const todayStr = now.toISOString().split('T')[0];
    const recordDateStr = recordDate.toISOString().split('T')[0];
    
    // Threshold time: 7:00 PM on the same day as the check-in
    const thresholdTime = new Date(recordDateStr + 'T19:00:00');

    if (recordDateStr < todayStr || (recordDateStr === todayStr && now > thresholdTime)) {
        record.checkOut = thresholdTime;
        
        // Recalculate working hours (in hrs, floating point)
        const diffMs = record.checkOut - record.checkIn;
        record.workingHours = Math.max(0, diffMs / (1000 * 60 * 60));

        // Mark as Half Day if needed
        if (record.workingHours < 4) {
            record.status = 'Half Day';
        }
        
        // Only save if it's a mongoose document
        if (typeof record.save === 'function') {
            await record.save();
        }
    }
    return record;
};

module.exports = { enforceAutoLogout };
