const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// The auth cookie is SameSite=None, so a cross-site form post would carry it.
// Browsers can't attach a custom header cross-origin without a CORS preflight,
// which our CORS policy only grants to the frontend origin.
const requireAppHeader = (req, res, next) => {
    if (SAFE_METHODS.has(req.method) || req.get("X-Requested-With")) return next();
    return res.status(403).json({ message: "Missing request header.", success: false });
};

export default requireAppHeader;
