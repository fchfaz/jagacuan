import React from 'react';
import {
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Wallet,
  Banknote,
  Building2,
  Smartphone,
  Tags,
  Coffee,
  Plane,
  Home,
  Zap,
  CreditCard,
  Target,
  PiggyBank,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Wallet,
  Banknote,
  Building2,
  Smartphone,
  Tags,
  Coffee,
  Plane,
  Home,
  Zap,
  CreditCard,
  Target,
  PiggyBank,
  Sparkles,
};

interface CategoryIconProps {
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name = 'Tags',
  color = '#6366F1',
  size = 'md',
  className = '',
}) => {
  const IconComponent = (name && ICON_MAP[name]) ? ICON_MAP[name] : Tags;

  const sizeClasses = {
    xs: 'w-6 h-6 p-1 text-xs',
    sm: 'w-8 h-8 p-1.5 text-sm',
    md: 'w-10 h-10 p-2 text-base',
    lg: 'w-12 h-12 p-2.5 text-lg',
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div
      className={`rounded-2xl flex items-center justify-center shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}18`, // 10% opacity pastel tint
        color: color,
      }}
    >
      <IconComponent size={iconSizes[size]} strokeWidth={2.2} />
    </div>
  );
};
