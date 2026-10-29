export interface Profile {
  id: string
  full_name: string | null
  role: 'user' | 'owner' | 'admin'
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  color: string | null
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  category_id: number | null
  address: string | null
  phone: string | null
  whatsapp: string | null
  city: string
  state: string
  lat: number | null
  lng: number | null
  cover_image: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  categories?: Category
  business_hours?: BusinessHours[]
}

export interface BusinessHours {
  id: number
  business_id: string
  day_of_week: number
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
}

export interface Photo {
  id: string
  business_id: string
  url: string
  created_at: string
}

export interface AdminStats {
  totalBusinesses: number
  activeBusinesses: number
  verifiedBusinesses: number
  totalUsers: number
  pendingVerification: number
  businessesPerCategory: { category: string; count: number }[]
}

export type BusinessWithOwner = Business & {
  profiles?: { full_name: string | null } | null
}
