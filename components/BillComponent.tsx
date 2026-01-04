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

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0

    // Handle different time formats
    let startTime = start
    let endTime = end

    // If time includes seconds, remove them
    if (start.includes(':')) {
      const startParts = start.split(':')
      startTime = `${startParts[0]}:${startParts[1]}`
    }
    if (end.includes(':')) {
      const endParts = end.split(':')
      endTime = `${endParts[0]}:${endParts[1]}`
    }

    const startDate = new Date(`2000-01-01T${startTime}:00`)
    let endDate = new Date(`2000-01-01T${endTime}:00`)

    if (endDate < startDate) {
      endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000) // add 24 hours for overnight shifts
    }

    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours)
  }

  const getRentalDescription = (rental: Rental) => {
    if (rental.machineType === 'harvester') {
      return `Harvester – ${rental.quantity} ${rental.unitType}${rental.description ? ` (${rental.description})` : ''}`
    } else if (rental.machineType === 'excavator' && rental.unitType === 'hourly') {
      const normalHours = rental.timeSlots?.filter(slot => !slot.isBreaker).reduce((sum, slot) => sum + calculateHours(slot.startTime, slot.endTime), 0) || 0
      const breakerHours = rental.timeSlots?.filter(slot => slot.isBreaker).reduce((sum, slot) => sum + calculateHours(slot.startTime, slot.endTime), 0) || 0
      return `JCB${rental.description ? ` (${rental.description})` : ''}`
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
    <div className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-6 lg:p-8 shadow-xl print:shadow-none print:p-4 border border-gray-200 print:border-none">
      {/* Enhanced Header */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 sm:py-6 px-3 sm:px-4 rounded-lg print:bg-white print:text-black print:border-b-2 print:border-gray-300 print:py-4">
        {/* Company Logo Placeholder */}
        <div className="mb-3 sm:mb-4 print:mb-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full mx-auto flex items-center justify-center print:w-12 print:h-12">
            <span className="text-blue-600 font-bold text-lg sm:text-xl print:text-lg">JD</span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 print:text-3xl print:text-gray-800">JD Agro & Earthmovers BILL</h1>
        <p className="text-lg sm:text-xl text-blue-100 print:text-gray-600">Professional Agro & Earthmovers Rental Services</p>
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-100 print:text-gray-500">
          <p>Tuljapur, Dist- Dharashiv - 413601</p>
          <p>Phone: +91-7558379410 | Email: shubhamja3333@gmail.com</p>
        </div>
      </div>

      {/* Bill Details Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Left Side - Bill To */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Bill To:</h2>
          <div className="space-y-1 sm:space-y-2">
            <p className="text-base sm:text-lg font-medium">{bill.customer.name}</p>
            <p className="text-sm sm:text-base text-gray-600">{bill.customer.address || 'N/A'}</p>
            <p className="text-sm sm:text-base text-gray-600">Phone: {bill.customer.contactNumber}</p>
          </div>
        </div>

        {/* Right Side - Bill Info */}
        <div className="text-left sm:text-right">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-base sm:text-lg"><span className="font-semibold">Bill No:</span> {bill.billNumber}</p>
            <p className="text-base sm:text-lg"><span className="font-semibold">Date:</span> {formatDateDDMMYYYY(bill.createdAt)}</p>
            {bill.dueDate && <p className="text-base sm:text-lg"><span className="font-semibold">Due Date:</span> {formatDateDDMMYYYY(bill.dueDate)}</p>}
            <p className="text-base sm:text-lg"><span className="font-semibold">Operator:</span> {bill.rentals[0]?.operator.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Rental Details Table */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 border-b-2 border-blue-200 pb-2">Rental Details</h2>
        <div className="overflow-x-auto border-2 border-gray-200 rounded-xl shadow-sm">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b-2 border-gray-200 uppercase tracking-wide">Description</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-800 border-b-2 border-gray-200 uppercase tracking-wide">Quantity</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-800 border-b-2 border-gray-200 uppercase tracking-wide">Rate</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-800 border-b-2 border-gray-200 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.rentals.map((rental, index) => (
                <tr key={rental.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-blue-25 transition-colors duration-150`}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 border-b border-gray-100 font-medium">
                    {getRentalDescription(rental)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center text-gray-800 border-b border-gray-100 font-medium">
                    {rental.unitType === 'hourly' && rental.machineType === 'excavator' ? (
                      <div className="flex flex-col items-center space-y-1">
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const normalSlots = rental.timeSlots?.filter(slot => !slot.isBreaker) || [];
                            const normalHours = normalSlots.length > 0 ? normalSlots.reduce((sum, slot) => {
                              const hours = slot.calculatedAmount || calculateHours(slot.startTime, slot.endTime);
                              return sum + hours;
                            }, 0) : 0;
                            return normalHours.toFixed(2);
                          })()} hrs (Normal)
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const breakerSlots = rental.timeSlots?.filter(slot => slot.isBreaker) || [];
                            const breakerHours = breakerSlots.length > 0 ? breakerSlots.reduce((sum, slot) => {
                              const hours = slot.calculatedAmount || calculateHours(slot.startTime, slot.endTime);
                              return sum + hours;
                            }, 0) : 0;
                            return breakerHours.toFixed(2);
                          })()} hrs (Breaker)
                        </div>
                      </div>
                    ) : (
                      `${rental.quantity} ${rental.unitType}`
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center text-gray-800 border-b border-gray-100 font-medium">
                    {rental.unitType === 'hourly' && rental.machineType === 'excavator' ?
                      `₹${rental.normalHourlyRate}/₹${rental.breakerHourlyRate}` :
                      `₹${rental.pricePerUnit.toLocaleString('en-IN')}`
                    }
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center font-bold text-gray-900 border-b border-gray-100">
                    {formatCurrency(rental.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Summary Section */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 border-b-2 border-blue-200 pb-2">Payment Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Amount Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 sm:p-6 rounded-xl border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base sm:text-lg font-bold text-emerald-800">Total Amount</p>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">₹</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{formatCurrency(bill.totalAmount)}</p>
          </div>

          {/* Total Paid Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 rounded-xl border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base sm:text-lg font-bold text-blue-800">Total Paid</p>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">✓</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Balance Due Card */}
          <div className={`p-4 sm:p-6 rounded-xl border-2 shadow-lg ${balanceDue > 0 ? 'bg-gradient-to-br from-red-50 to-pink-100 border-red-200' : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-base sm:text-lg font-bold ${balanceDue > 0 ? 'text-red-800' : 'text-gray-800'}`}>Balance Due</p>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${balanceDue > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                <span className="text-white font-bold text-xs sm:text-sm">{balanceDue > 0 ? '!' : '✓'}</span>
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${balanceDue > 0 ? 'text-red-700' : 'text-gray-700'}`}>{formatCurrency(balanceDue)}</p>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Payment History</h3>
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="max-h-32 sm:max-h-40 overflow-y-auto">
              {getAllPayments().length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {getAllPayments().map((payment, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{formatDateDDMMYYYY(payment.date)}</span>
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{payment.mode}</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                  <p className="text-gray-500 italic">No payments recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mb-8 border-t border-gray-300 pt-4">
        <p className="text-lg text-gray-700">Thank you for your business!</p>
        <p className="text-sm text-gray-600">For any queries, please contact us.</p>
      </div>

      {/* Enhanced Professional Buttons */}
      <div className="flex justify-center gap-6 print:hidden mt-8">
        <button
          onClick={onPrint}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <span>🖨️</span>
          Print Bill
        </button>
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <span>✕</span>
          Close
        </button>
      </div>
    </div>
  )
}

export default BillComponent
