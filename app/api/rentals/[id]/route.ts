import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        operator: true,
        customer: true
      }
    })

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    return NextResponse.json(rental)
  } catch (error) {
    console.error('Get rental error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      description,
      customerName,
      customerContact,
      customerAddress,
      dieselCost,
      maintenanceCost,
      operatorSalary,
      paidAmount,
      paymentStatus,
      paymentMode,
      additionalAmount,
      additionalPaymentMode
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

    const additional = parseFloat(additionalAmount || 0)
    const updatedPaidAmount = parseFloat(paidAmount || 0) + additional

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        machineType,
        unitType,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount: parseFloat(totalAmount),
        description: description || null,
        dieselCost: parseFloat(dieselCost || 0),
        maintenanceCost: parseFloat(maintenanceCost || 0),
        operatorSalary: parseFloat(operatorSalary || 0),
        paidAmount: updatedPaidAmount,
        paymentStatus: paymentStatus || 'UNPAID',
        paymentMode: paymentMode || null
      },
      include: {
        operator: true,
        customer: true,
        payments: true
      }
    })

    // Create payment record for additional amount
    if (additional > 0 && additionalPaymentMode) {
      await prisma.payment.create({
        data: {
          rentalId: id,
          amount: additional,
          mode: additionalPaymentMode
        }
      })
    }

    // Update the first payment's mode to match the rental's paymentMode
    if (paymentMode) {
      const firstPayment = await prisma.payment.findFirst({
        where: { rentalId: id },
        orderBy: { id: 'asc' }
      })
      if (firstPayment) {
        await prisma.payment.update({
          where: { id: firstPayment.id },
          data: { mode: paymentMode }
        })
      }
    }

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

    // Delete all payments associated with this rental first
    await prisma.payment.deleteMany({
      where: { rentalId: id }
    })

    await prisma.rental.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Rental deleted successfully' })
  } catch (error) {
    console.error('Delete rental error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
