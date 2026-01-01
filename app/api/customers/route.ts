import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
