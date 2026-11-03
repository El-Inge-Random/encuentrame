'use client'

import {
  UtensilsCrossed, Scissors, Heart, ShoppingBag,
  Wrench, BookOpen, Music, Home,
} from 'lucide-react'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed,
  Scissors,
  Heart,
  ShoppingBag,
  Wrench,
  BookOpen,
  Music,
  Home,
}

export default function CategoryIcon({ name }: { name: string }) {
  const Icon = ICONS[name]
  if (!Icon) return null
  return <Icon className="w-7 h-7" />
}
