const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, "your_secret_key");
        req.user = decoded; // contains userId
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};