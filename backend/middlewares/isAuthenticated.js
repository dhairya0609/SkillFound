import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const readToken = (req) => {
    if (req.cookies?.token) return req.cookies.token;
    const header = req.headers.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const decodeUserId = (req) => {
    const token = readToken(req);
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.SECRET_KEY)?.userId || null;
    } catch {
        return null;
    }
};

const isAuthenticated = (req, res, next) => {
    const userId = decodeUserId(req);
    if (!userId) {
        return res.status(401).json({
            message: "Please log in to continue.",
            success: false,
        });
    }
    req.id = userId;
    next();
};

export const optionalAuth = (req, res, next) => {
    const userId = decodeUserId(req);
    if (userId) req.id = userId;
    next();
};

export const requireRole = (role) => async (req, res, next) => {
    const user = await User.findById(req.id);
    if (!user) {
        return res.status(401).json({ message: "Please log in to continue.", success: false });
    }
    if (user.role !== role) {
        return res.status(403).json({
            message: role === "recruiter" ? "This action is for recruiters." : "This action is for candidates.",
            success: false,
        });
    }
    req.user = user;
    next();
};

export default isAuthenticated;
