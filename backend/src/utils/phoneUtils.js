/**
 * Reusable utility to ensure phone numbers are in E.164 format.
 * Specifically handles Indian numbers (+91) as requested.
 */
const formatToE164 = (phone) => {
  if (!phone) return null;
  
  // 1. Remove all non-numeric characters except the leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  // 2. If it already starts with +, ensure it's just the numbers after it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // 3. Handle Indian numbers (+91) specifically as per requirements
  // If it's 10 digits, assume it's a local Indian number and add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }

  // 4. If it starts with 91 and has 12 digits, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  // 5. Default fallback: add + if missing (E.164 requires it)
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }

  return cleaned;
};

const isValidPhone = (phone) => {
  const formatted = formatToE164(phone);
  if (!formatted) return false;
  
  // E.164 check: + followed by 10-15 digits
  return /^\+\d{10,15}$/.test(formatted);
};

module.exports = { formatToE164, isValidPhone };
