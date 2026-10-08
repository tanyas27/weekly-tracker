import React from 'react'
import {
  Laptop,
  Dumbbell,
  BookOpen,
  Coffee,
  Utensils,
  Heart,
  Sparkles,
  Music,
  Briefcase,
  Code,
  GraduationCap,
  ShoppingBag,
  Sun,
  Moon,
  Smile,
  CheckSquare,
  Bike,
  Gamepad2,
  Plane,
  Phone,
  LucideIcon,
} from 'lucide-react'

export interface TaskIconDefinition {
  id: string
  label: string
  icon: LucideIcon
}

export const TASK_ICONS: TaskIconDefinition[] = [
  { id: 'laptop', label: 'Work', icon: Laptop },
  { id: 'dumbbell', label: 'Workout', icon: Dumbbell },
  { id: 'book-open', label: 'Reading', icon: BookOpen },
  { id: 'coffee', label: 'Break', icon: Coffee },
  { id: 'utensils', label: 'Meal', icon: Utensils },
  { id: 'heart', label: 'Wellness', icon: Heart },
  { id: 'sparkles', label: 'Focus', icon: Sparkles },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'briefcase', label: 'Meeting', icon: Briefcase },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'graduation-cap', label: 'Study', icon: GraduationCap },
  { id: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { id: 'sun', label: 'Morning', icon: Sun },
  { id: 'moon', label: 'Night', icon: Moon },
  { id: 'smile', label: 'Leisure', icon: Smile },
  { id: 'check-square', label: 'Chores', icon: CheckSquare },
  { id: 'bike', label: 'Cycling', icon: Bike },
  { id: 'gamepad-2', label: 'Gaming', icon: Gamepad2 },
  { id: 'plane', label: 'Travel', icon: Plane },
  { id: 'phone', label: 'Call', icon: Phone },
]

const TASK_ICON_MAP = new Map<string, LucideIcon>(
  TASK_ICONS.map((item) => [item.id.toLowerCase(), item.icon])
)

export function getTaskIcon(iconId?: string | null): LucideIcon | null {
  if (!iconId) return null
  const normalized = iconId.trim().toLowerCase().replace(/_/g, '-')
  return TASK_ICON_MAP.get(normalized) || null
}

interface TaskIconProps {
  icon?: string | null
  className?: string
}

export function TaskIcon({ icon, className = 'w-4 h-4' }: TaskIconProps) {
  if (!icon) return null
  const IconComponent = getTaskIcon(icon)
  if (IconComponent) {
    return React.createElement(IconComponent, { className, 'aria-hidden': 'true' })
  }
  // Render literal Unicode emoji or text symbol
  return (
    <span
      className={`inline-flex items-center justify-center leading-none select-none text-center ${className}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
