import { NextResponse } from 'next/server'
import { getOwnerBusiness } from '@/app/actions/business'

export async function GET() {
  const business = await getOwnerBusiness()
  return NextResponse.json({ business })
}
