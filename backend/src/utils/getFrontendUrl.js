/**
 * Resolves the Frontend URL for the application.
 * Strictly relies on the FRONTEND_URL environment variable.
 * Throws an error if the variable is missing to prevent broken links in production.
 */
const getFrontendUrl = () => {
  const baseUrl = process.env.FRONTEND_URL;
  
  if (!baseUrl) {
    console.error("[CRITICAL] FRONTEND_URL environment variable is missing!");
    throw new Error("FRONTEND_URL configuration is missing. System integrity compromised.");
  }
  
  return baseUrl.replace(/\/$/, "");
};

module.exports = getFrontendUrl;
