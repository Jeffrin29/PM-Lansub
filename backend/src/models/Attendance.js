const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HrEmployee",
        default: null
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: Date,
        default: null
    },
    checkOut: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["Present", "Absent", "Late", "Holiday", "Half Day"],
        default: "Present"
    },
    late: {
        type: Boolean,
        default: false
    },
    workingHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for better query performance
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
// Optional index for employee-based lookups
attendanceSchema.index({ employeeId: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);