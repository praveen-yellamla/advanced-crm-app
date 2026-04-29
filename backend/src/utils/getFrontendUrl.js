/**
 * Dynamically resolves the Frontend URL based on the request origin or environment variables.
 * This ensures invite links work across Localhost, Staging, and Production without manual intervention.
 * @param {Object} req - Express Request Object
 * @returns {string} The base URL of the frontend application
 */
const getFrontendUrl = (req) => {
  // 1. Explicit override (highest priority)
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }

  // 2. Smart Host Detection
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Use Origin first, then Referer (stripping path), then fallback to Host header
  let detectedHost = origin || (referer ? new URL(referer).origin : null);

  if (detectedHost) {
    return detectedHost.replace(/\/$/, "");
  }

  // 3. Environment Fallbacks
  if (process.env.NODE_ENV === "production") {
    // If we're in production and detection failed, use the hardcoded production URL
    return "https://advanced-crm-frontend.onrender.com";
  }

  // 4. Development Fallback (Localhost 5173 is standard for Vite)
  return "http://localhost:5173";
};

module.exports = getFrontendUrl;
