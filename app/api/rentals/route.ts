import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDummyRentals, addDummyRental, dummyUsers, getDummyCustomers, addDummyCustomer, getDummyCustomerByName } from '@/lib/dummy-data'

export async function GET(request: NextRequest) {
  try {
    const rentals = await prisma.rental.findMany({
      include: {
        customer: true,
        operator: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Get rentals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { machineType, unitType, quantity, acreage, pricePerUnit, totalAmount, description, customerName, customerContact, customerAddress, operatorId, date, dieselCost, maintenanceCost, operatorSalary } = await request.json()

    if (!machineType || !unitType || !quantity || !pricePerUnit || !totalAmount || !customerName || !customerContact || !operatorId || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const operator = await prisma.user.findUnique({
      where: { id: parseInt(operatorId) }
    })
    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 400 })
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { name: customerName }
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          contactNumber: customerContact,
          address: customerAddress,
        }
      })
    }

    const rental = await prisma.rental.create({
      data: {
        machineType,
        unitType,
        quantity: parseFloat(quantity),
        acreage: acreage ? parseFloat(acreage) : null,
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount: parseFloat(totalAmount),
        description: description || null,
        customerId: customer.id,
        operatorId: parseInt(operatorId),
        date: new Date(date),
        dieselCost: parseFloat(dieselCost || 0),
        maintenanceCost: parseFloat(maintenanceCost || 0),
        operatorSalary: parseFloat(operatorSalary || 0),
      },
      include: {
        customer: true,
        operator: true
      }
    })

    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error('Create rental error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
