import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import NavbarServer from '@/components/layout/NavbarServer'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'

export const dynamic = 'force-dynamic'

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Encuentrame - Tierra Blanca, Veracruz',
  description: 'Descubre los negocios locales de Tierra Blanca, Veracruz',
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
      </body>
    </html>
  )
}
