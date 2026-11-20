import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadFile, StorageUnavailableError } from "../utils/storage.js";
import { serverError } from "../utils/http.js";
import { isProduction } from "../config/env.js";

const SESSION_MS = 24 * 60 * 60 * 1000;

const cookieOptions = (req) =>
  req.secure || isProduction
    ? { httpOnly: true, secure: true, sameSite: "none", path: "/" }
    : { httpOnly: true, secure: false, sameSite: "lax", path: "/" };

const startSession = (req, res, user, message) => {
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
  return res
    .status(200)
    .cookie("token", token, { ...cookieOptions(req), maxAge: SESSION_MS })
    .json({ message, user: user.toPublic(), token, success: true });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const splitSkills = (skills) =>
  Array.from(
    new Set(
      (Array.isArray(skills) ? skills : String(skills).split(","))
        .map((s) => String(s).trim().slice(0, 40))
        .filter(Boolean)
    )
  ).slice(0, 40);

export const register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;
    if (!fullName || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address.", success: false });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters.", success: false });
    }
    if (!["student", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Choose a valid role.", success: false });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        message: "An account with this email already exists.",
        success: false,
      });
    }

    const photo = req.files?.profilePhoto?.[0];
    const profilePhoto = photo ? await uploadFile(photo) : "";

    await User.create({
      fullName,
      email,
      phoneNumber,
      password: await bcrypt.hash(password, 10),
      role,
      profile: { profilePhoto },
    });

    return res.status(201).json({
      message: "Account created. You can log in now.",
      success: true,
    });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return res.status(503).json({ message: error.message, success: false });
    }
    return serverError(res, "Registration error", error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    const valid = user && !user.isDemo && (await bcrypt.compare(password, user.password));
    if (!valid) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }
    return startSession(req, res, user, `Welcome back, ${user.fullName.split(" ")[0]}`);
  } catch (error) {
    return serverError(res, "Login error", error);
  }
};

export const demoLogin = async (req, res) => {
  try {
    const role = req.body?.role === "recruiter" ? "recruiter" : "student";
    const user = await User.findOne({ isDemo: true, role });
    if (!user) {
      return res.status(503).json({
        message: "Demo accounts aren't set up on this server yet.",
        success: false,
      });
    }
    return startSession(req, res, user, `You're exploring as ${user.fullName}`);
  } catch (error) {
    return serverError(res, "Demo login error", error);
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.id);
  if (!user) {
    return res.status(401).json({ message: "Please log in to continue.", success: false });
  }
  return res.status(200).json({ user: user.toPublic(), success: true });
};

export const logout = async (req, res) => {
  return res
    .status(200)
    .clearCookie("token", cookieOptions(req))
    .json({
      message: "Logged out.",
      success: true,
    });
};

const PROFILE_TEXT_FIELDS = {
  headline: 120,
  bio: 600,
  experienceSummary: 1200,
  location: 80,
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, skills, yearsOfExperience } = req.body;

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isDemo) {
      const changesIdentity =
        (email && String(email).toLowerCase().trim() !== user.email) ||
        (phoneNumber && phoneNumber !== user.phoneNumber) ||
        (fullName && fullName !== user.fullName);
      if (changesIdentity) {
        return res.status(403).json({
          success: false,
          message: "Name, email and phone are locked on demo accounts.",
        });
      }
    }

    if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (email && String(email).toLowerCase().trim() !== user.email) {
      const taken = await User.exists({ email: String(email).toLowerCase().trim() });
      if (taken) {
        return res.status(400).json({ success: false, message: "That email is already in use." });
      }
      user.email = email;
    }
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    let profileChanged = false;
    for (const [field, max] of Object.entries(PROFILE_TEXT_FIELDS)) {
      if (req.body[field] !== undefined) {
        const next = String(req.body[field]).trim().slice(0, max);
        if (next !== (user.profile[field] || "")) {
          user.profile[field] = next;
          profileChanged = true;
        }
      }
    }
    if (skills !== undefined) {
      const next = splitSkills(skills);
      if (next.join("|") !== (user.profile.skills || []).join("|")) {
        user.profile.skills = next;
        profileChanged = true;
      }
    }
    if (yearsOfExperience !== undefined && yearsOfExperience !== "") {
      const years = Math.min(50, Math.max(0, Number(yearsOfExperience)));
      if (Number.isFinite(years) && years !== user.profile.yearsOfExperience) {
        user.profile.yearsOfExperience = years;
        profileChanged = true;
      }
    }

    const resumeFile = req.files?.file?.[0];
    if (resumeFile) {
      user.profile.resume = await uploadFile(resumeFile, { resourceType: "raw" });
      user.profile.resumeOriginalName = resumeFile.originalname;
    }
    const profilePhotoFile = req.files?.profilePhoto?.[0];
    if (profilePhotoFile) {
      user.profile.profilePhoto = await uploadFile(profilePhotoFile);
    }

    if (profileChanged) user.profileVersion = Math.max(Date.now(), (user.profileVersion || 0) + 1);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated.",
      user: user.toPublic(),
    });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return res.status(503).json({ success: false, message: error.message });
    }
    return serverError(res, "Update profile error", error, "Something went wrong while updating your profile.");
  }
};
