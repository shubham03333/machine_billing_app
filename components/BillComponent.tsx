import React from 'react'

interface Payment {
  id: number
  rentalId: number
  amount: number
  mode: string
  date: string
}

interface Rental {
  id: number
  machineType: string
  unitType: string
  quantity: number
  acreage?: number
  pricePerUnit: number
  totalAmount: number
  description?: string
  operator: { name: string }
  date: string
  dieselCost: number
  maintenanceCost: number
  operatorSalary: number
  paidAmount: number
  paymentStatus: string
  paymentMode?: string
  payments: Payment[]
  normalHourlyRate?: number
  breakerHourlyRate?: number
  timeSlots?: Array<{ startTime: string; endTime: string; isBreaker: boolean; calculatedAmount: number }>
}

interface Bill {
  id: number
  billNumber: string
  customer: { name: string; address?: string; contactNumber: string }
  rentals: Rental[]
  totalAmount: number
  paidAmount: number
  status: string
  dueDate?: string
  createdAt: string
}

interface BillComponentProps {
  bill: Bill
  onClose: () => void
  onPrint: () => void
}

const BillComponent: React.FC<BillComponentProps> = ({ bill, onClose, onPrint }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDateDDMMYYYY = (date: string | Date) => {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getRentalDescription = (rental: Rental) => {
    if (rental.machineType === 'harvester') {
      return `Harvester – ${rental.quantity} ${rental.unitType}${rental.description ? ` (${rental.description})` : ''}`
    } else if (rental.machineType === 'excavator' && rental.unitType === 'hourly') {
      const normalHours = rental.timeSlots?.filter(slot => !slot.isBreaker).reduce((sum, slot) => sum + (new Date(`2000-01-01T${slot.endTime}:00`).getTime() - new Date(`2000-01-01T${slot.startTime}:00`).getTime()) / (1000 * 60 * 60), 0) || 0
      const breakerHours = rental.timeSlots?.filter(slot => slot.isBreaker).reduce((sum, slot) => sum + (new Date(`2000-01-01T${slot.endTime}:00`).getTime() - new Date(`2000-01-01T${slot.startTime}:00`).getTime()) / (1000 * 60 * 60), 0) || 0
      return `JCB – ${normalHours.toFixed(2)} hrs (Normal) + ${breakerHours.toFixed(2)} hrs (Breaker)${rental.description ? ` (${rental.description})` : ''}`
    } else if (rental.machineType === 'excavator') {
      return `JCB – ${rental.quantity} ${rental.unitType}${rental.description ? ` (${rental.description})` : ''}`
    } else {
      return `${rental.machineType.charAt(0).toUpperCase() + rental.machineType.slice(1)} – ${rental.quantity} ${rental.unitType}${rental.description ? ` (${rental.description})` : ''}`
    }
  }

  const getAllPayments = () => {
    const allPayments: Array<{ amount: number; mode: string; date: string }> = []
    bill.rentals.forEach(rental => {
      rental.payments.forEach(payment => {
        allPayments.push({
          amount: payment.amount,
          mode: payment.mode,
          date: payment.date
        })
      })
    })
    return allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const totalPaid = bill.paidAmount || getAllPayments().reduce((sum, payment) => sum + payment.amount, 0)
  const balanceDue = bill.totalAmount - totalPaid

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-4">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">MACHINE RENTAL BILL</h1>
        <p className="text-lg text-gray-600">Professional Equipment Rental Services</p>
      </div>

      {/* Bill Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Side - Bill To */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Bill To:</h2>
          <div className="space-y-2">
            <p className="text-lg font-medium">{bill.customer.name}</p>
            <p className="text-gray-600">{bill.customer.address || 'N/A'}</p>
            <p className="text-gray-600">Phone: {bill.customer.contactNumber}</p>
          </div>
        </div>

        {/* Right Side - Bill Info */}
        <div className="text-right">
          <div className="space-y-2">
            <p className="text-lg"><span className="font-semibold">Bill No:</span> {bill.billNumber}</p>
            <p className="text-lg"><span className="font-semibold">Date:</span> {formatDateDDMMYYYY(bill.createdAt)}</p>
            <p className="text-lg"><span className="font-semibold">Operator:</span> {bill.rentals[0]?.operator.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Rental Details Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Rental Details</h2>
        <div className="overflow-hidden border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Description</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Quantity</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Rate</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.rentals.map((rental, index) => (
                <tr key={rental.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-800 border-b">
                    {getRentalDescription(rental)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">
                    {rental.unitType === 'hourly' && rental.machineType === 'excavator' ?
                      `${rental.timeSlots?.filter(slot => !slot.isBreaker).reduce((sum, slot) => sum + (new Date(`2000-01-01T${slot.endTime}:00`).getTime() - new Date(`2000-01-01T${slot.startTime}:00`).getTime()) / (1000 * 60 * 60), 0).toFixed(2)} + ${rental.timeSlots?.filter(slot => slot.isBreaker).reduce((sum, slot) => sum + (new Date(`2000-01-01T${slot.endTime}:00`).getTime() - new Date(`2000-01-01T${slot.startTime}:00`).getTime()) / (1000 * 60 * 60), 0).toFixed(2)} hrs` :
                      `${rental.quantity} ${rental.unitType}`
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">
                    {rental.unitType === 'hourly' && rental.machineType === 'excavator' ?
                      `₹${rental.normalHourlyRate}/₹${rental.breakerHourlyRate}` :
                      `₹${rental.pricePerUnit.toLocaleString('en-IN')}`
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-gray-800 border-b">
                    {formatCurrency(rental.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side - Total Amount */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-lg font-semibold text-green-800">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(bill.totalAmount)}</p>
          </div>

          {/* Right Side - Payment Details */}
          <div className="space-y-4">
            {/* Payment History */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Payment History</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {getAllPayments().length > 0 ? (
                  getAllPayments().map((payment, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{formatDateDDMMYYYY(payment.date)} - {payment.mode}</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No payments recorded</p>
                )}
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-800">Total Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>

            {/* Balance Due */}
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Balance Due</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(balanceDue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mb-8 border-t border-gray-300 pt-4">
        <p className="text-lg text-gray-700">Thank you for your business!</p>
        <p className="text-sm text-gray-600">For any queries, please contact us.</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={onPrint}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Print Bill
        </button>
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default BillComponent
