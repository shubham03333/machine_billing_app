import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      machineType,
      unitType,
      quantity,
      pricePerUnit,
      totalAmount,
      customerName,
      customerContact,
      customerAddress,
      dieselCost,
      maintenanceCost,
      operatorSalary
    } = body

    if (!machineType || !unitType || !quantity || !pricePerUnit || !totalAmount ||
        !customerName || !customerContact || !customerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { customer: true }
    })

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    // Update customer info
    const updatedCustomer = await prisma.customer.update({
      where: { id: rental.customerId },
      data: {
        name: customerName,
        contactNumber: customerContact,
        address: customerAddress
      }
    })

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        machineType,
        unitType,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount: parseFloat(totalAmount),
        dieselCost: parseFloat(dieselCost || 0),
        maintenanceCost: parseFloat(maintenanceCost || 0),
        operatorSalary: parseFloat(operatorSalary || 0)
      },
      include: {
        operator: true,
        customer: true
      }
    })

    return NextResponse.json(updatedRental)
  } catch (error) {
    console.error('Update rental error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const rental = await prisma.rental.findUnique({
      where: { id }
    })

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    await prisma.rental.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Rental deleted successfully' })
  } catch (error) {
    console.error('Delete rental error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
