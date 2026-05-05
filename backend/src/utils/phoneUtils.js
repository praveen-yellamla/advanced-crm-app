/**
 * Reusable utility to ensure phone numbers are in E.164 format.
 * Specifically handles Indian numbers (+91) as requested.
 */
const formatToE164 = (phone) => {
  if (!phone) return null;
  
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If it doesn't start with +, assume Indian (+91)
  if (!cleaned.startsWith('+')) {
    // If it starts with 91 but no +, add +
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+91' + cleaned;
    }
  }

  return cleaned;
};

const isValidPhone = (phone) => {
  const formatted = formatToE164(phone);
  if (!formatted) return false;
  
  // Basic E.164 check (between 10 and 15 digits)
  return formatted.length >= 11 && formatted.length <= 16;
};

module.exports = { formatToE164, isValidPhone };
