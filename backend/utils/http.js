export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const serverError = (res, label, error, message = "Something went wrong. Please try again.") => {
  console.error(`${label}:`, error?.message || error);
  return res.status(500).json({ message, success: false });
};
