// ─── iTURSH Design Tokens ─────────────────────────────────────────────────────

export const Colors = {
    // Brand - Teal
    primary: '#1DADA8',
    primaryDark: '#0F6E6A',
    primaryLight: '#E1F7F6',
    primaryMid: '#5ECECA',

    // Background
    bgDark: '#1A1A2E',       // charcoal - headers
    bgSoft: '#2D2D44',       // charcoal soft
    bgScreen: '#F5FAFA',     // off-white screen background

    // Accent
    accentBlue: '#2E6EDB',   // notification badges

    // Text
    textPrimary: '#1A1A2E',
    textSecondary: '#4A6060',
    textMuted: '#8FA5A5',

    // Status
    statusPending: '#D97706',
    statusPendingBg: '#FEF3C7',
    statusApproved: '#16A34A',
    statusApprovedBg: '#DCFCE7',
    statusBooked: '#0F6E6A',
    statusBookedBg: '#E1F7F6',
    statusCancelled: '#6B7280',
    statusCancelledBg: '#F3F4F6',

    // UI
    white: '#FFFFFF',
    border: '#E2ECEC',
    cardShadow: 'rgba(29,173,168,0.10)',
};

export const Shadow = {
    card: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        shadowColor: Colors.bgDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
};

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    pill: 999,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Status badge helpers
export const getStatusColors = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return { bg: Colors.statusApprovedBg, text: Colors.statusApproved };
        case 'BOOKED':
            return { bg: Colors.statusBookedBg, text: Colors.statusBooked };
        case 'REJECTED':
        case 'CANCELLED':
            return { bg: Colors.statusCancelledBg, text: Colors.statusCancelled };
        default: // PENDING
            return { bg: Colors.statusPendingBg, text: Colors.statusPending };
    }
};

// Greeting based on time of day
export const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

// Relative time helper
export const getRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
};

// Get user initials from name
export const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

// Areas for Explore screen
export const AREAS = [
    { id: 'mp-nagar', label: 'MP Nagar', keyword: 'mp nagar' },
    { id: 'arera', label: 'Arera Colony', keyword: 'arera' },
    { id: 'kolar', label: 'Kolar Road', keyword: 'kolar' },
    { id: 'hoshangabad', label: 'Hoshangabad Rd', keyword: 'hoshangabad' },
    { id: 'new-market', label: 'New Market', keyword: 'new market' },
    { id: 'shahpura', label: 'Shahpura', keyword: 'shahpura' },
];

export const AREA_GRADIENT_COLORS: Record<string, string[]> = {
    'mp-nagar':     ['#1DADA8', '#0F6E6A'],
    'arera':        ['#2E6EDB', '#1A4BA8'],
    'kolar':        ['#7C3AED', '#4C1D95'],
    'hoshangabad':  ['#D97706', '#92400E'],
    'new-market':   ['#16A34A', '#14532D'],
    'shahpura':     ['#DB2777', '#881337'],
};
