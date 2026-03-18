"use client";

import { useState, useEffect } from "react";

export default function ClockButton() {
    const [clockedIn, setClockedIn] = useState(false);
    const [time, setTime] = useState("");

    // ✅ Load from localStorage (persist UI state)
    useEffect(() => {
        const stored = localStorage.getItem("clockedIn");
        const storedTime = localStorage.getItem("clockTime");

        if (stored === "true") {
            setClockedIn(true);
            if (storedTime) setTime(storedTime);
        }
    }, []);

    const handleClockIn = () => {
        const now = new Date().toLocaleTimeString();

        setClockedIn(true);
        setTime(now);

        localStorage.setItem("clockedIn", "true");
        localStorage.setItem("clockTime", now);
    };

    const handleClockOut = () => {
        setClockedIn(false);
        setTime("");

        localStorage.setItem("clockedIn", "false");
        localStorage.removeItem("clockTime");
    };

    return (
        <div>
            <button
                onClick={clockedIn ? handleClockOut : handleClockIn}
                className={`px-4 py-2 rounded text-white ${clockedIn ? "bg-red-500" : "bg-green-500"
                    }`}
            >
                {clockedIn ? "Clock Out" : "Clock In"}
            </button>

            {time && (
                <p className="text-xs text-gray-400 mt-1">
                    Clocked in at {time}
                </p>
            )}
        </div>
    );
}