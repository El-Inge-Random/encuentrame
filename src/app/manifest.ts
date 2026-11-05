import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Encuentrame - Directorio de negocios locales',
    short_name: 'Encuentrame',
    description: 'Descubre y encuentra los negocios locales cerca de ti.',
    start_url: '/',
    display: 'standalone',
    background_color: '#7C3AED',
    theme_color: '#7C3AED',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
