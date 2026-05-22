export const getRoleColor = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return { from: '#f97316', to: '#ef4444', text: '#ea580c' }; // Orange to Red
    case 'ADMIN':
      return { from: '#3b82f6', to: '#2563eb', text: '#2563eb' }; // Blue
    case 'MANAGER':
    case 'TEAM_LEAD':
      return { from: '#a855f7', to: '#7e22ce', text: '#9333ea' }; // Purple
    case 'AGENT':
      return { from: '#06b6d4', to: '#0891b2', text: '#0891b2' }; // Cyan
    case 'QA_OPERATOR':
      return { from: '#22c55e', to: '#16a34a', text: '#16a34a' }; // Green
    case 'PLATFORM_SUPPORT':
      return { from: '#f59e0b', to: '#d97706', text: '#d97706' }; // Amber
    default:
      return { from: '#818cf8', to: '#5b5fcf', text: '#6366f1' }; // Default Accent
  }
};
