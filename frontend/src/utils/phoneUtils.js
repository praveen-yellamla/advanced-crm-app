/**
 * Frontend utility for phone number formatting.
 * Ensures the agent is always dialing in E.164 (+91) format.
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  // Remove all non-numeric characters except +
  let cleaned = phone.toString().replace(/[^\d+]/g, '');

  // Prepend +91 if it's a standard 10-digit Indian number or missing prefix
  if (!cleaned.startsWith("+")) {
    // If it starts with 91 but no +, add +
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+91" + cleaned;
    }
  }

  return cleaned;
};

export const isValidPhone = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return formatted.length >= 11 && formatted.length <= 16;
};
