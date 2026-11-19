import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "./cloudinary.js";
import getDataUri from "./datauri.js";
import { cloudinaryConfigured, isProduction, publicBaseUrl } from "../config/env.js";

export const LOCAL_UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");

const SAFE_EXT = /^\.(pdf|png|jpe?g|webp|gif|svg)$/i;

export class StorageUnavailableError extends Error {}

export const uploadFile = async (file, { resourceType = "image" } = {}) => {
  if (cloudinaryConfigured) {
    const result = await cloudinary.uploader.upload(getDataUri(file).content, {
      resource_type: resourceType,
    });
    return result.secure_url;
  }
  if (isProduction) {
    throw new StorageUnavailableError("File uploads are not configured on this server.");
  }
  const ext = path.extname(file.originalname || "");
  const name = `${crypto.randomUUID()}${SAFE_EXT.test(ext) ? ext.toLowerCase() : ""}`;
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, name), file.buffer);
  return `${publicBaseUrl}/uploads/${name}`;
};
