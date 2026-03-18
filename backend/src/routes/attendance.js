const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

// Get today's attendance
router.get("/today/:userId", async (req, res) => {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const record = await Attendance.findOne({ userId, date: today });

    res.json(record);
});

// CLOCK IN
router.post("/clock-in", async (req, res) => {
    const { userId } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({ userId, date: today });

    if (existing) {
        return res.status(400).json({ message: "Already clocked in today" });
    }

    const attendance = new Attendance({
        userId,
        date: today,
        checkIn: new Date()
    });

    await attendance.save();
    res.json(attendance);
});

// CLOCK OUT
router.post("/clock-out", async (req, res) => {
    const { userId } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
        return res.status(400).json({ message: "Clock in first" });
    }

    if (attendance.checkOut) {
        return res.status(400).json({ message: "Already clocked out" });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json(attendance);
});

module.exports = router;