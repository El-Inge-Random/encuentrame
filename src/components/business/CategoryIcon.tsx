'use client'

import { CATEGORY_ICONS } from './categoryIcons'

export default function CategoryIcon({ name }: { name: string }) {
  const Icon = CATEGORY_ICONS[name]
  if (!Icon) return null
  return <Icon className="w-7 h-7" />
}
