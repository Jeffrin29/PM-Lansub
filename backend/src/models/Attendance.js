const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: String, // "2026-03-17"
        required: true
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);