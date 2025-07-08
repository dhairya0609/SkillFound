import multer from "multer";

const storage = multer.memoryStorage();

export const singleUpload = multer({ storage: multer.memoryStorage() }).fields([
  { name: "file", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);