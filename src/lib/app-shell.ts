export type ShellNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  match?: "exact" | "prefix";
};

export const PORTAL_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/account",
    label: "Home",
    shortLabel: "Home",
    description: "Order overview and account summary.",
    match: "exact",
  },
  {
    href: "/account/orders",
    label: "Orders",
    shortLabel: "Orders",
    description: "Order history, payment status, and tracking.",
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    shortLabel: "Places",
    description: "Saved delivery addresses and preferences.",
  },
  {
    href: "/account/reviews",
    label: "Reviews",
    shortLabel: "Reviews",
    description: "Pending ratings and submitted feedback.",
  },
  {
    href: "/account/profile",
    label: "Profile",
    shortLabel: "Account",
    description: "Identity, phone number, and preferences.",
  },
];

export const ADMIN_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    shortLabel: "Home",
    description: "Queues, delivery pressure, and low-stock signals.",
    match: "exact",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    shortLabel: "Orders",
    description: "Operational order board and detailed workflow control.",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    shortLabel: "Payments",
    description: "Manual transfer review and proof verification.",
  },
  {
    href: "/admin/delivery",
    label: "Delivery",
    shortLabel: "Delivery",
    description: "Dispatch, assignment, and live tracking supervision.",
  },
  {
    href: "/admin/catalog/products",
    label: "Catalog",
    shortLabel: "Catalog",
    description: "Products, variants, merchandising, and stock controls.",
  },
  {
    href: "/admin/layout",
    label: "Layout",
    shortLabel: "Layout",
    description: "Published sections, drafts, and breakpoint previews.",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    shortLabel: "People",
    description: "Customer lookup, history, and support context.",
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    shortLabel: "Reviews",
    description: "Moderation and featured trust signals.",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    shortLabel: "Settings",
    description: "Bank accounts, notifications, delivery, and admin controls.",
  },
];
