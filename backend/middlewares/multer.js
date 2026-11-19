import multer from "multer";

const MB = 1024 * 1024;

const imageOrPdf = (req, file, cb) => {
  const ok =
    (file.fieldname === "file" && file.mimetype === "application/pdf") ||
    file.mimetype.startsWith("image/");
  cb(ok ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname), ok);
};

export const singleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB, files: 2 },
  fileFilter: imageOrPdf,
}).fields([
  { name: "file", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * MB, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    cb(ok ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname), ok);
  },
}).single("resume");
