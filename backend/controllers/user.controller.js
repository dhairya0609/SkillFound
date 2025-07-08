import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;
    if (!fullName || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }
    const file = req.file;
    const profilePhoto = req.files?.profilePhoto?.[0];

    const fileUri = getDataUri(profilePhoto);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exists with this email.",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: cloudResponse.secure_url,
      },
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
  }
};
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User does not exist with this email.",
        success: false,
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }
    if (user.role !== role) {
      return res.status(400).json({
        message: "Account does not exist with current role.",
        success: false,
      });
    }
    const tokenData = {
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullName}`,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profile: user.profile,
        },
        success: true,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
      success: false,
    });
  }
};
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
};
// export const updateProfile = async (req, res) => {
//     try {
//         const {fullName, email, phoneNumber, bio, skills} = req.body;
//         const file = req.file;
//         const fileUri = getDataUri(file);
//         const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

//         if (req.files?.profilePhoto) {
//             const profilePhotoFile = req.files.profilePhoto[0];
//             const profilePhotoUri = getDataUri(profilePhotoFile);
//             const cloudRes = await cloudinary.uploader.upload(profilePhotoUri.content);

//             user.profile.profilePhoto = cloudRes.secure_url;
//         }

//         let skillsArray;
//         if(skills)
//         {
//             skillsArray = skills.split(',');
//         }

//         const userId = req.id;
//         let user = await User.findById(userId);

//         if(!user) {
//             return res.status(404).json({
//                 message: "User not found.",
//                 success: false,
//             });
//         }
//         if(fullName) user.fullName = fullName;
//         if(email) user.email = email;
//         if(phoneNumber) user.phoneNumber = phoneNumber;
//         if(bio) user.profile.bio = bio;
//         if(skills) user.profile.skills = skillsArray;
//         if(cloudResponse){
//             user.profile.resume = cloudResponse.secure_url // save the cloudinary url
//             user.profile.resumeOriginalName = file.originalname // Save the original file name
//         }

//         await user.save();

//         return res.status(200).json({
//             message: "Profile updated successfully.",
//             user: {
//                 _id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phoneNumber: user.phoneNumber,
//                 role: user.role,
//                 profile: user.profile,
//             },
//             success: true,
//         });
//     } catch (error) {
//         console.error("Update profile error:", error);
//     }
// }
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, bio, skills } = req.body;

    // ✅ Get user first
    const userId = req.id; // assuming you're setting this from isAuthenticated middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ✅ Handle resume upload (optional)
    const resumeFile = req.files?.file?.[0];
    if (resumeFile) {
      const resumeUri = getDataUri(resumeFile);
      const cloudResume = await cloudinary.uploader.upload(resumeUri.content, {
        resource_type: "raw",
      });
      user.profile.resume = cloudResume.secure_url;
      user.profile.resumeOriginalName = resumeFile.originalname;
    }

    // ✅ Handle profile photo upload (optional)
    const profilePhotoFile = req.files?.profilePhoto?.[0];
    if (profilePhotoFile) {
      const photoUri = getDataUri(profilePhotoFile);
      const cloudPhoto = await cloudinary.uploader.upload(photoUri.content);
      user.profile.profilePhoto = cloudPhoto.secure_url;
    }

    // ✅ Update fields if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills)
      user.profile.skills = skills.split(",").map((skill) => skill.trim());

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating profile.",
    });
  }
};
