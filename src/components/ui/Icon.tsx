"use client";

import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Handbag,
  History,
  Home,
  Image,
  Info,
  LayoutTemplate,
  LogOut,
  Mail,
  MapPinned,
  Menu,
  Minus,
  Package,
  Package2,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Upload,
  UserRound,
  UsersRound,
  X,
  XCircle,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconName corresponds to SF Symbol semantic patterns.
 */
export type IconName =
  | "store"
  | "bag"
  | "account"
  | "orders"
  | "settings"
  | "home"
  | "search"
  | "menu"
  | "close"
  | "plus"
  | "minus"
  | "trash"
  | "archive"
  | "chevron-right"
  | "chevron-left"
  | "chevron-up"
  | "chevron-down"
  | "check"
  | "check-circle"
  | "x-circle"
  | "info"
  | "mail"
  | "phone"
  | "map-pin"
  | "navigation"
  | "truck"
  | "package"
  | "history"
  | "edit"
  | "users"
  | "logout"
  | "star"
  | "credit-card"
  | "tag"
  | "layout"
  | "save"
  | "sparkles"
  | "image"
  | "upload";

const ICON_MAP: Record<IconName, LucideIcon> = {
  store: ShoppingBag,
  bag: Handbag,
  account: UserRound,
  orders: Package2,
  settings: Settings2,
  home: Home,
  search: Search,
  menu: Menu,
  close: X,
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  archive: Archive,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  check: Check,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  info: Info,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPinned,
  navigation: ArrowRight,
  truck: Truck,
  package: Package,
  history: History,
  edit: Pencil,
  users: UsersRound,
  logout: LogOut,
  star: Star,
  "credit-card": CreditCard,
  tag: Tag,
  layout: LayoutTemplate,
  save: Save,
  sparkles: Sparkles,
  image: Image,
  upload: Upload,
};

interface IconProps extends LucideProps {
  name: IconName;
  size?: number | string;
  strokeWidth?: number;
}

/**
 * A central library component for system iconography.
 * Maps semantic names to Apple SF Symbol metaphors.
 */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className,
  ...props
}: IconProps) {
  const LucideComponent = ICON_MAP[name] || Info;

  return (
    <LucideComponent
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
