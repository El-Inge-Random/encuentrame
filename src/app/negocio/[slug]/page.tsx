import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react'
import { getBusinessBySlug } from '@/app/actions/business'
import { getDayName } from '@/lib/utils/business'
import { Button } from '@/components/ui/button'
import BusinessMapWrapper from '@/components/map/BusinessMapWrapper'
import OpenBadge from '@/components/business/OpenBadge'

export const dynamic = 'force-dynamic'

interface BusinessPageProps {
  params: Promise<{ slug: string }>
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-72 bg-gradient-to-br from-purple-100 to-orange-100">
        {business.cover_image ? (
          <Image src={business.cover_image} alt={business.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🏪</div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              {business.categories && <p className="text-orange-500 font-medium mt-1">{business.categories.name}</p>}
            </div>
            {business.business_hours && <OpenBadge hours={business.business_hours} large />}
          </div>

          {business.description && <p className="text-gray-600 mt-4 leading-relaxed">{business.description}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {business.phone && (
              <a href={`tel:${business.phone}`}>
                <Button variant="outline" className="gap-2"><Phone className="w-4 h-4" /> {business.phone}</Button>
              </a>
            )}
            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-green-500 hover:bg-green-600"><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
              </a>
            )}
          </div>

          {business.address && (
            <p className="mt-4 text-gray-500 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-purple-700" /> {business.address}, {business.city}, {business.state}
            </p>
          )}
        </div>

        {/* Hours */}
        {business.business_hours && business.business_hours.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Horarios</h2>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const h = business.business_hours?.find(x => x.day_of_week === day)
                return (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{getDayName(day)}</span>
                    <span className="text-gray-500">
                      {h?.is_closed || !h ? 'Cerrado' : `${h.opens_at?.slice(0, 5)} - ${h.closes_at?.slice(0, 5)}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Map */}
        {business.lat && business.lng && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Ubicación</h2>
            <BusinessMapWrapper lat={Number(business.lat)} lng={Number(business.lng)} name={business.name} />
          </div>
        )}

        {/* Photos */}
        {business.photos && business.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Fotos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {business.photos.map((photo) => (
                <div key={photo.id} className="relative h-48 rounded-xl overflow-hidden">
                  <Image src={photo.url} alt="foto" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
