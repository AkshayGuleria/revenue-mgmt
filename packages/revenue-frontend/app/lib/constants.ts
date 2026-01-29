/**
 * Application Constants
 */

export const APP_NAME =
  import.meta.env.VITE_APP_NAME || "Revenue Management System";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5177";

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_OFFSET: 0,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM d, yyyy",
  DISPLAY_LONG: "MMMM d, yyyy",
  DISPLAY_WITH_TIME: "MMM d, yyyy h:mm a",
  ISO: "yyyy-MM-dd",
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

/**
 * Currency formats
 */
export const CURRENCY = {
  DEFAULT: "USD",
  DECIMAL_PLACES: 2,
} as const;

/**
 * Toast notification durations (ms)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

/**
 * Status color mappings for badges
 */
export const STATUS_COLORS = {
  // Account status
  active: "green",
  inactive: "gray",
  suspended: "red",

  // Contract status
  draft: "gray",
  // active is already defined above
  expired: "yellow",
  cancelled: "red",
  renewed: "blue",

  // Invoice status
  // draft is already defined above
  sent: "blue",
  paid: "green",
  overdue: "red",
  // cancelled is already defined above
  void: "gray",
} as const;

/**
 * Navigation menu items
 */
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: "Building2",
  },
  {
    label: "Contracts",
    href: "/contracts",
    icon: "FileText",
  },
  {
    label: "Products",
    href: "/products",
    icon: "Package",
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: "Receipt",
  },
  {
    label: "Billing",
    href: "/billing",
    icon: "CreditCard",
  },
] as const;
