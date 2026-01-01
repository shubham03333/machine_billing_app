import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        rentals: {
          select: {
            totalAmount: true,
            date: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate revenue and other stats for each customer
    const customersWithStats = customers.map(customer => {
      const totalRevenue = customer.rentals.reduce((sum, rental) => sum + rental.totalAmount, 0)
      const totalRentals = customer.rentals.length
      const lastRentalDate = customer.rentals.length > 0
        ? new Date(Math.max(...customer.rentals.map(r => new Date(r.date).getTime())))
        : null

      return {
        ...customer,
        totalRevenue,
        totalRentals,
        lastRentalDate
      }
    })

    return NextResponse.json(customersWithStats)
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
