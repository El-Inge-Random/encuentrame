import { BusinessHours } from '@/types'

export function isBusinessOpen(hours: BusinessHours[]): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM

  const todayHours = hours.find(h => h.day_of_week === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.opens_at || !todayHours.closes_at) return false

  return currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
}

export function getDayName(day: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[day]
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
