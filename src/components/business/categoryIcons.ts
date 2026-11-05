import {
  UtensilsCrossed, Scissors, Heart, ShoppingBag, Wrench, BookOpen, Music, Home,
  Coffee, Pizza, Stethoscope, Pill, Car, Dumbbell, Shirt, Gift,
  Hammer, PawPrint, Camera, Cake, Flower2, Baby, Gamepad2, Building2,
  type LucideIcon,
} from 'lucide-react'

// Fuente de verdad de los íconos de categorías. La clave es el nombre que
// se guarda en categories.icon; el valor es el componente de Lucide.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Scissors,
  Heart,
  ShoppingBag,
  Wrench,
  BookOpen,
  Music,
  Home,
  Coffee,
  Pizza,
  Stethoscope,
  Pill,
  Car,
  Dumbbell,
  Shirt,
  Gift,
  Hammer,
  PawPrint,
  Camera,
  Cake,
  Flower2,
  Baby,
  Gamepad2,
  Building2,
}

// Lista de nombres para poblar el selector del formulario.
export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS)
