import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import NavbarServer from '@/components/layout/NavbarServer'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister'
import InstallPrompt from '@/components/layout/InstallPrompt'
import { Toaster } from '@/components/ui/toaster'

export const dynamic = 'force-dynamic'

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Encuentrame - Directorio de negocios locales',
  description: 'Descubre y encuentra los negocios locales de tu zona',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Encuentrame',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body>
        <Suspense fallback={<Navbar user={null} />}>
          <NavbarServer />
        </Suspense>
        <main>{children}</main>
        <Footer />
        <Toaster />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  )
}
