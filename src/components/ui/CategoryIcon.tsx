import React from "react";
import {
  Home,
  Zap,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Fuel,
  ShoppingBag,
  Wallet,
  DollarSign,
  Car,
  Coffee,
  Smartphone,
  HeartPulse,
  Sparkles,
  Tag,
  Film,
  Utensils,
  Plane,
  Gift,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Zap,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Fuel,
  ShoppingBag,
  Wallet,
  DollarSign,
  Car,
  Coffee,
  Smartphone,
  HeartPulse,
  Sparkles,
  Tag,
  Film,
  Utensils,
  Plane,
  Gift,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className = "w-5 h-5", color }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
}
