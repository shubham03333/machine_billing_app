'use client'

import { useState, useEffect } from 'react'
import { Minus, LogIn, BarChart3, Trash2, Plus, RefreshCw } from 'lucide-react'
import { DummyCustomer, getDummyCustomerByContact } from '@/lib/dummy-data'

const STANDARD_PRICES = {
  tractor: { hourly: 500, trip: 500, acre: 1500 },
  harvester: { hourly: 3000, trip: 3000, acre: 3000, guntha: 75 },
  excavator: { hourly: 1000, trip: 200, acre: 400 }
}

const MACHINES = [
  { id: 'harvester', name: 'Harvester', units: ['acre', 'guntha', 'hourly'] },
  { id: 'excavator', name: 'Excavator', units: ['hourly', 'trip'] },
  { id: 'tractor', name: 'Tractor', units: ['hourly', 'trip'] }
]

const UNITS = ['hourly', 'trip', 'acre', 'guntha']

const parseQuantity = (input: string, unit: string) => {
  const trimmed = input.trim();
  const hasUnits = /acre|guntha/i.test(trimmed);

  if (!hasUnits) {
    if (unit === 'acre') {
      const parts = trimmed.split('.');
      if (parts.length === 2) {
        const acres = parseInt(parts[0]) || 0;
        const gunthas = parseInt(parts[1]) || 0;
        return acres + gunthas / 40;
      }
    }
    const num = parseFloat(trimmed);
    return isNaN(num) ? 0 : num;
  }

  const regex = /(\d+(?:\.\d+)?)\s*(acre|guntha)/gi;
  let totalGunthas = 0;
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    const value = parseFloat(match[1]);
    const unitType = match[2].toLowerCase();
    if (unitType === 'acre') {
      totalGunthas += value * 40;
    } else if (unitType === 'guntha') {
      totalGunthas += value;
    }
  }
  if (unit === 'guntha') {
    return totalGunthas;
  } else if (unit === 'acre') {
    return totalGunthas / 40;
  }
  return 0;
};

const formatQuantityForDisplay = (quantity: number, unit: string) => {
  if (unit === 'acre') {
    const acres = Math.floor(quantity);
    const gunthas = Math.round((quantity - acres) * 40);
    return `${acres}.${gunthas.toString().padStart(2, '0')}`;
  }
  return quantity.toString();
};

interface User {
  id: number
  name: string
  role: string
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
  customer: { name: string; address: string; contactNumber: string }
  operator: { name: string }
  date: string
  dieselCost: number
  maintenanceCost: number
  operatorSalary: number
  createdAt: string
}

interface Expense {
  id: number
  description: string
  amount: number
  date: string
  operator: { name: string }
  dieselCost?: number
  maintenanceCost?: number
  operatorSalary?: number
  createdAt: string
}

interface Customer {
  id: number
  name: string
  contactNumber: string
  address?: string
  totalRevenue: number
  totalRentals: number
  lastRentalDate: Date | null
  createdAt: string
}

export default function Home() {
  const [pin, setPin] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [quantityText, setQuantityText] = useState('1')
  const [timeSlots, setTimeSlots] = useState<{start: string, end: string}[]>([{start: '', end: ''}])

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(`2000-01-01T${start}:00`)
    const endDate = new Date(`2000-01-01T${end}:00`)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours)
  }

  const calculateTotalHours = (slots: {start: string, end: string}[]) => {
    return slots.reduce((total, slot) => total + calculateHours(slot.start, slot.end), 0)
  }

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, {start: '', end: ''}])
  }

  const removeTimeSlot = (index: number) => {
    const newSlots = timeSlots.filter((_, i) => i !== index)
    setTimeSlots(newSlots.length === 0 ? [{start: '', end: ''}] : newSlots)
  }

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...timeSlots]
    newSlots[index][field] = value
    setTimeSlots(newSlots)
    const totalHours = calculateTotalHours(newSlots)
    setQuantity(totalHours)
  }

  const setCurrentTime = (index: number, field: 'start' | 'end') => {
    const now = new Date()
    const timeString = now.toTimeString().slice(0, 5) // HH:MM format
    updateTimeSlot(index, field, timeString)
  }
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [description, setDescription] = useState('')

  const [dieselCost, setDieselCost] = useState('')
  const [maintenanceCost, setMaintenanceCost] = useState('')
  const [operatorSalary, setOperatorSalary] = useState('')
  const [otherExpenses, setOtherExpenses] = useState<{ key: string; value: string }[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDieselCost, setExpenseDieselCost] = useState('')
  const [expenseMaintenanceCost, setExpenseMaintenanceCost] = useState('')
  const [expenseOperatorSalary, setExpenseOperatorSalary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('today')
  const [prices, setPrices] = useState(STANDARD_PRICES)
  const [showEditRates, setShowEditRates] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [activeTab, setActiveTab] = useState('new-rental')
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null)
  const [adminActiveTab, setAdminActiveTab] = useState('overview')
  const [expenseFilter, setExpenseFilter] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    operator: ''
  })
  const [rentalFilter, setRentalFilter] = useState({
    dateFrom: '',
    dateTo: '',
    machine: ''
  })
  const [editingRental, setEditingRental] = useState<Rental | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editRentalData, setEditRentalData] = useState({
    machineType: '',
    unitType: '',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    description: '',
    customerName: '',
    customerContact: '',
    customerAddress: '',
    dieselCost: '',
    maintenanceCost: '',
    operatorSalary: ''
  })

  // Auto-calculate total amount when quantity or price per unit changes
  useEffect(() => {
    const quantity = parseFloat(editRentalData.quantity) || 0
    const pricePerUnit = parseFloat(editRentalData.pricePerUnit) || 0
    const totalAmount = quantity * pricePerUnit
    setEditRentalData(prev => ({
      ...prev,
      totalAmount: totalAmount.toString()
    }))
  }, [editRentalData.quantity, editRentalData.pricePerUnit, editRentalData.machineType, editRentalData.unitType])
  const [editExpenseData, setEditExpenseData] = useState({
    description: '',
    amount: '',
    dieselCost: '',
    maintenanceCost: '',
    operatorSalary: ''
  })

  useEffect(() => {
    if (user) {
      fetchRentals()
      fetchCustomers()
      fetchExpenses()
    }
  }, [user])

  const login = async () => {
    if (!pin) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      const data = await res.json()
      if (res.ok) {
        setUser(data)
        setError('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Login failed')
    }
    setLoading(false)
  }

  const fetchRentals = async () => {
    try {
      const res = await fetch('/api/rentals')
      const data = await res.json()
      setRentals(data)
    } catch (err) {
      console.error('Failed to fetch rentals')
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to fetch customers')
    }
  }

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses')
      const data = await res.json()
      setExpenses(data)
    } catch (err) {
      console.error('Failed to fetch expenses')
    }
  }

  const saveExpense = async () => {
    if (!user) return

    let finalDescription = expenseDescription
    let finalAmount = expenseAmount

    // If amount is empty, sum the category fields
    if (!finalAmount) {
      const diesel = parseFloat(expenseDieselCost) || 0
      const maintenance = parseFloat(expenseMaintenanceCost) || 0
      const salary = parseFloat(expenseOperatorSalary) || 0
      finalAmount = (diesel + maintenance + salary).toString()
    }

    // If description is empty, generate one based on filled categories
    if (!finalDescription) {
      const categories = []
      if (parseFloat(expenseDieselCost) > 0) categories.push('Diesel')
      if (parseFloat(expenseMaintenanceCost) > 0) categories.push('Maintenance')
      if (parseFloat(expenseOperatorSalary) > 0) categories.push('Operator Salary')
      finalDescription = categories.length > 0 ? categories.join(', ') : 'Expense'
    }

    if (!finalDescription || !finalAmount) return

    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: finalDescription,
          amount: finalAmount,
          operatorId: user.id,
          dieselCost: expenseDieselCost ? parseFloat(expenseDieselCost) : undefined,
          maintenanceCost: expenseMaintenanceCost ? parseFloat(expenseMaintenanceCost) : undefined,
          operatorSalary: expenseOperatorSalary ? parseFloat(expenseOperatorSalary) : undefined,
        })
      })

      if (res.ok) {
        fetchExpenses()
        setExpenseDescription('')
        setExpenseAmount('')
        setExpenseDieselCost('')
        setExpenseMaintenanceCost('')
        setExpenseOperatorSalary('')
        setError('')
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to save expense')
    }
    setLoading(false)
  }

  const createRental = async () => {
    if (!selectedMachine || !selectedUnit || !user || !customerName || !customerContact || !customerAddress) return

    const pricePerUnit = prices[selectedMachine as keyof typeof prices][selectedUnit as keyof typeof prices[keyof typeof prices]]
    const totalAmount = quantity * pricePerUnit

    setLoading(true)
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineType: selectedMachine,
          unitType: selectedUnit,
          quantity,
          pricePerUnit,
          totalAmount,
          description: description || undefined,
          customerName,
          customerContact,
          customerAddress,
          dieselCost: dieselCost ? parseFloat(dieselCost) : 0,
          maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : 0,
          operatorSalary: operatorSalary ? parseFloat(operatorSalary) : 0,
          operatorId: user.id,
          date: new Date().toISOString()
        })
      })

      if (res.ok) {
        fetchRentals()
        setSelectedMachine('')
        setSelectedUnit('')
        setQuantity(1)
        setTimeSlots([{start: '', end: ''}])
        setCustomerName('')
        setCustomerContact('')
        setCustomerAddress('')
        setDieselCost('')
        setMaintenanceCost('')
        setOperatorSalary('')
        setError('')
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to create rental')
    }
    setLoading(false)
  }

  const deleteRental = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rental?')) return

    try {
      await fetch(`/api/rentals/${id}`, { method: 'DELETE' })
      fetchRentals()
    } catch (err) {
      console.error('Failed to delete rental')
    }
  }

  const startEditRental = (rental: Rental) => {
    setEditingRental(rental)
    setEditRentalData({
      machineType: rental.machineType,
      unitType: rental.unitType,
      quantity: rental.quantity.toString(),
      pricePerUnit: rental.pricePerUnit.toString(),
      totalAmount: rental.totalAmount.toString(),
      description: rental.description || '',
      customerName: rental.customer.name,
      customerContact: rental.customer.contactNumber,
      customerAddress: rental.customer.address || '',
      dieselCost: rental.dieselCost.toString(),
      maintenanceCost: rental.maintenanceCost.toString(),
      operatorSalary: rental.operatorSalary.toString()
    })
  }

  const updateRental = async () => {
    if (!editingRental) return

    setLoading(true)
    try {
      const res = await fetch(`/api/rentals/${editingRental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRentalData)
      })

      if (res.ok) {
        fetchRentals()
        setEditingRental(null)
        setError('')
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update rental')
    }
    setLoading(false)
  }

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditExpenseData({
      description: expense.description,
      amount: expense.amount.toString(),
      dieselCost: (expense.dieselCost || 0).toString(),
      maintenanceCost: (expense.maintenanceCost || 0).toString(),
      operatorSalary: (expense.operatorSalary || 0).toString()
    })
  }

  const updateExpense = async () => {
    if (!editingExpense) return

    setLoading(true)
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editExpenseData)
      })

      if (res.ok) {
        fetchExpenses()
        setEditingExpense(null)
        setError('')
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update expense')
    }
    setLoading(false)
  }

  const deleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch (err) {
      console.error('Failed to delete expense')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Rental Tracker</h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 border rounded-lg text-center text-2xl text-black"
              maxLength={4}
            />
            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Test PINs:</strong></p>
            <p>Admin: 1234</p>
            <p>Operator: 5678 or 9999</p>
          </div>
        </div>
      </div>
    )
  }

  const getExpenseCategory = (expense: Expense) => {
    if (expense.dieselCost !== undefined && expense.dieselCost > 0) return 'Diesel'
    if (expense.maintenanceCost !== undefined && expense.maintenanceCost > 0) return 'Maintenance'
    if (expense.operatorSalary !== undefined && expense.operatorSalary > 0) return 'Operator Salary'
    return 'Other'
  }

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const fromDate = expenseFilter.dateFrom ? new Date(expenseFilter.dateFrom) : null
    const toDate = expenseFilter.dateTo ? new Date(expenseFilter.dateTo) : null

    if (fromDate && expenseDate < fromDate) return false
    if (toDate && expenseDate > toDate) return false
    if (expenseFilter.category && getExpenseCategory(expense) !== expenseFilter.category) return false
    if (expenseFilter.operator && expense.operator.name !== expenseFilter.operator) return false

    return true
  })

  const filteredRentals = rentals.filter(rental => {
    const rentalDate = new Date(rental.date)
    const fromDate = rentalFilter.dateFrom ? new Date(rentalFilter.dateFrom) : null
    const toDate = rentalFilter.dateTo ? new Date(rentalFilter.dateTo) : null

    if (fromDate && rentalDate < fromDate) return false
    if (toDate && rentalDate > toDate) return false
    if (rentalFilter.machine && rental.machineType !== rentalFilter.machine) return false

    return true
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const totalRentalsAmount = filteredRentals.reduce((sum, rental) => sum + rental.totalAmount, 0)

if (user.role === 'admin') {
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <button
              onClick={() => setUser(null)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>

          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setAdminActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium ${
                adminActiveTab === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setAdminActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg font-medium ${
                adminActiveTab === 'expenses'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => setAdminActiveTab('customers')}
              className={`px-4 py-2 rounded-lg font-medium ${
                adminActiveTab === 'customers'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Customers
            </button>
          </div>

          {adminActiveTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(rentals.reduce((sum, r) => sum + r.totalAmount, 0))}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Net Profit</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(
                      rentals.reduce((sum, r) => sum + r.totalAmount, 0) -
                      expenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Recent Rentals</h2>
                    <div className="flex gap-4 items-center">
                      <button
                        onClick={() => {
                          fetchRentals()
                          fetchCustomers()
                          fetchExpenses()
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </button>
                      <input
                        type="date"
                        value={rentalFilter.dateFrom}
                        onChange={(e) => setRentalFilter({...rentalFilter, dateFrom: e.target.value})}
                        className="px-3 py-1 border rounded text-sm"
                        placeholder="From Date"
                      />
                      <input
                        type="date"
                        value={rentalFilter.dateTo}
                        onChange={(e) => setRentalFilter({...rentalFilter, dateTo: e.target.value})}
                        className="px-3 py-1 border rounded text-sm"
                        placeholder="To Date"
                      />
                      <select
                        value={rentalFilter.machine}
                        onChange={(e) => setRentalFilter({...rentalFilter, machine: e.target.value})}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="">All Machines</option>
                        <option value="tractor">Tractor</option>
                        <option value="harvester">Harvester</option>
                        <option value="excavator">Excavator</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRentals.map((rental) => (
                        <tr key={rental.id}>
                          <td className="px-6 py-4 whitespace-nowrap capitalize">{rental.machineType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{rental.operator.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{rental.customer.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{rental.quantity} {rental.unitType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(rental.totalAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(rental.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditRental(rental)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <BarChart3 size={16} />
                              </button>
                              <button
                                onClick={() => deleteRental(rental.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right font-semibold">Total Rentals:</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold text-lg">
                          {formatCurrency(totalRentalsAmount)}
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminActiveTab === 'expenses' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">All Expenses</h2>
                  <div className="text-xl font-bold text-red-600">
                    Total: {formatCurrency(totalExpenses)}
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap items-center">
                  <button
                    onClick={() => {
                      fetchRentals()
                      fetchCustomers()
                      fetchExpenses()
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                  <input
                    type="date"
                    value={expenseFilter.dateFrom}
                    onChange={(e) => setExpenseFilter({...expenseFilter, dateFrom: e.target.value})}
                    className="px-3 py-1 border rounded text-sm"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={expenseFilter.dateTo}
                    onChange={(e) => setExpenseFilter({...expenseFilter, dateTo: e.target.value})}
                    className="px-3 py-1 border rounded text-sm"
                    placeholder="To Date"
                  />
                  <select
                    value={expenseFilter.category}
                    onChange={(e) => setExpenseFilter({...expenseFilter, category: e.target.value})}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Operator Salary">Operator Salary</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={expenseFilter.operator}
                    onChange={(e) => setExpenseFilter({...expenseFilter, operator: e.target.value})}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="">All Operators</option>
                    {Array.from(new Set(expenses.map(e => e.operator.name))).map(operator => (
                      <option key={operator} value={operator}>{operator}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getExpenseCategory(expense)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{expense.operator.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <BarChart3 size={16} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-semibold">Total Expenses:</td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold text-lg">
                        {formatCurrency(totalExpenses)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {adminActiveTab === 'customers' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">All Customers</h2>
                  <button
                    onClick={() => {
                      fetchRentals()
                      fetchCustomers()
                      fetchExpenses()
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Rentals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Rental Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.contactNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.address || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                          {formatCurrency(customer.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.totalRentals}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.lastRentalDate ? new Date(customer.lastRentalDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Rental Modal */}
      {editingRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Rental</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Machine Type</label>
                <select
                  value={editRentalData.machineType}
                  onChange={(e) => setEditRentalData({...editRentalData, machineType: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="tractor">Tractor</option>
                  <option value="harvester">Harvester</option>
                  <option value="excavator">Excavator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit Type</label>
                <select
                  value={editRentalData.unitType}
                  onChange={(e) => setEditRentalData({...editRentalData, unitType: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {MACHINES.find(m => m.id === editRentalData.machineType)?.units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={editRentalData.quantity}
                  onChange={(e) => setEditRentalData({...editRentalData, quantity: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price Per Unit</label>
                <input
                  type="number"
                  value={editRentalData.pricePerUnit}
                  onChange={(e) => setEditRentalData({...editRentalData, pricePerUnit: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Amount</label>
                <input
                  type="number"
                  value={editRentalData.totalAmount}
                  onChange={(e) => setEditRentalData({...editRentalData, totalAmount: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={editRentalData.description}
                  onChange={(e) => setEditRentalData({...editRentalData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  value={editRentalData.customerName}
                  onChange={(e) => setEditRentalData({...editRentalData, customerName: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer Contact</label>
                <input
                  type="text"
                  value={editRentalData.customerContact}
                  onChange={(e) => setEditRentalData({...editRentalData, customerContact: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer Address</label>
                <input
                  type="text"
                  value={editRentalData.customerAddress}
                  onChange={(e) => setEditRentalData({...editRentalData, customerAddress: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Diesel Cost</label>
                <input
                  type="number"
                  value={editRentalData.dieselCost}
                  onChange={(e) => setEditRentalData({...editRentalData, dieselCost: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maintenance Cost</label>
                <input
                  type="number"
                  value={editRentalData.maintenanceCost}
                  onChange={(e) => setEditRentalData({...editRentalData, maintenanceCost: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Operator Salary</label>
                <input
                  type="number"
                  value={editRentalData.operatorSalary}
                  onChange={(e) => setEditRentalData({...editRentalData, operatorSalary: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={updateRental}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white p-2 rounded-lg disabled:bg-gray-300"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setEditingRental(null)}
                className="flex-1 bg-gray-500 text-white p-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={editExpenseData.description}
                  onChange={(e) => setEditExpenseData({...editExpenseData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={editExpenseData.amount}
                  onChange={(e) => setEditExpenseData({...editExpenseData, amount: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Diesel Cost</label>
                <input
                  type="number"
                  value={editExpenseData.dieselCost}
                  onChange={(e) => setEditExpenseData({...editExpenseData, dieselCost: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maintenance Cost</label>
                <input
                  type="number"
                  value={editExpenseData.maintenanceCost}
                  onChange={(e) => setEditExpenseData({...editExpenseData, maintenanceCost: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Operator Salary</label>
                <input
                  type="number"
                  value={editExpenseData.operatorSalary}
                  onChange={(e) => setEditExpenseData({...editExpenseData, operatorSalary: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={updateExpense}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white p-2 rounded-lg disabled:bg-gray-300"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setEditingExpense(null)}
                className="flex-1 bg-gray-500 text-white p-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Rentals Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Rentals for {selectedCustomer.name}</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {rentals.filter(rental => rental.customer.contactNumber === selectedCustomer.contactNumber).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No rentals found for this customer.</p>
              ) : (
                <div className="space-y-4">
                  {rentals
                    .filter(rental => rental.customer.contactNumber === selectedCustomer.contactNumber)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((rental) => (
                      <div key={rental.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="font-medium text-gray-700">Date:</span>
                            <div>{new Date(rental.date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Machine:</span>
                            <div className="capitalize">{rental.machineType}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <div>{rental.quantity} {rental.unitType}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Amount:</span>
                            <div className="text-green-600 font-semibold">{formatCurrency(rental.totalAmount)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="font-medium text-gray-700">Operator:</span>
                            <div>{rental.operator.name}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <div>{rental.customer.address || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Contact:</span>
                            <div>{rental.customer.contactNumber}</div>
                          </div>
                        </div>
                        {rental.description && (
                          <div className="mb-4">
                            <span className="font-medium text-gray-700">Description:</span>
                            <div className="mt-1">{rental.description}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Diesel Cost:</span>
                            <div className="text-red-600">{formatCurrency(rental.dieselCost)}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Maintenance Cost:</span>
                            <div className="text-red-600">{formatCurrency(rental.maintenanceCost)}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Operator Salary:</span>
                            <div className="text-red-600">{formatCurrency(rental.operatorSalary)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

  // Operator view
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <button
            onClick={() => setUser(null)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('new-rental')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'new-rental'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New Rental
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'expenses'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Expenses
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'rentals'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rentals
          </button>
        </div>

        {activeTab === 'new-rental' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Rental</h2>

            {/* Customer Selection */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value)
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(e.target.value.length > 0)
                      }}
                      onFocus={() => setShowCustomerDropdown(customerSearch.length > 0)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="Enter customer name"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {(customers || [])
                          .filter(customer =>
                            customer && customer.name && customer.name.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .map((customer) => (
                            <div
                              key={customer.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setCustomerName(customer.name)
                                setCustomerContact(customer.contactNumber)
                                setCustomerAddress(customer.address || '')
                                setShowCustomerDropdown(false)
                              }}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.contactNumber}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={customerContact}
                      onChange={(e) => {
                        const contact = e.target.value
                        setCustomerContact(contact)
                        if (contact) {
                          const customer = getDummyCustomerByContact(contact)
                          if (customer) {
                            setCustomerName(customer.name)
                            setCustomerAddress(customer.address)
                          }
                        }
                      }}
                      placeholder="Enter contact number"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address / Location</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter customer address or work location"
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Nature of Work / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of the work"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {MACHINES.map((machine) => (
                <button
                  key={machine.id}
                  onClick={() => {
                    setSelectedMachine(machine.id);
                    if (machine.id === 'harvester') {
                      setSelectedUnit('acre');
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedMachine === machine.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded flex items-center justify-center font-bold text-white text-lg ${
                    machine.id === 'harvester' ? 'bg-green-500' :
                    machine.id === 'excavator' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {machine.name.charAt(0)}
                  </div>
                  <div className="font-medium">{machine.name}</div>
                </button>
              ))}
            </div>

            {selectedMachine && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Unit Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {MACHINES.find(m => m.id === selectedMachine)?.units.map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setSelectedUnit(unit)}
                      className={`p-2 rounded border capitalize ${
                        selectedUnit === unit
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMachine && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Edit Rates</h3>
                  <button
                    onClick={() => setShowEditRates(!showEditRates)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    {showEditRates ? 'Cancel' : 'Edit Rates'}
                  </button>
                </div>
                {showEditRates && (
                  <div className="space-y-4">
                    {MACHINES.filter(machine => !selectedMachine || machine.id === selectedMachine).map((machine) => (
                      <div key={machine.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2 capitalize">{machine.name} Rates</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {machine.units.filter(unit => !selectedUnit || unit === selectedUnit).map((unit) => (
                            <div key={unit}>
                              <label className="block text-sm font-medium mb-1 capitalize">{unit}</label>
                              <input
                                type="number"
                                value={prices[machine.id as keyof typeof prices][unit as keyof typeof prices[keyof typeof prices]]}
                                onChange={(e) => {
                                  const newPrices = { ...prices }
                                  const newValue = parseInt(e.target.value) || 0
                                  newPrices[machine.id as keyof typeof prices][unit as keyof typeof prices[keyof typeof prices]] = newValue
                                  if (machine.id === 'harvester' && unit === 'acre') {
                                    newPrices.harvester.guntha = Math.round(newValue / 40)
                                  }
                                  setPrices(newPrices)
                                }}
                                className="w-full p-2 border rounded"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedUnit && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {selectedUnit === 'hourly' ? 'Time Selection' : 'Quantity'}
                </label>
                {(selectedUnit === 'acre' || selectedUnit === 'guntha') ? (
                  <input
                    type="text"
                    value={quantityText}
                    onChange={(e) => {
                      setQuantityText(e.target.value);
                      const parsed = parseQuantity(e.target.value, selectedUnit);
                      setQuantity(parsed);
                    }}
                    placeholder={`Enter quantity (e.g., 1.45 or 2 acre 35 guntha)`}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : selectedUnit === 'hourly' ? (
                  <div>
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-end gap-2 mb-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Start Time</label>
                          <div className="flex gap-1">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                              className="flex-1 p-2 border rounded-lg"
                            />
                            <button
                              onClick={() => setCurrentTime(index, 'start')}
                              className="bg-green-500 text-white px-2 py-2 rounded text-sm hover:bg-green-600"
                              title="Set current time"
                            >
                              Now
                            </button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">End Time</label>
                          <div className="flex gap-1">
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                              className="flex-1 p-2 border rounded-lg"
                            />
                            <button
                              onClick={() => setCurrentTime(index, 'end')}
                              className="bg-green-500 text-white px-2 py-2 rounded text-sm hover:bg-green-600"
                              title="Set current time"
                            >
                              Now
                            </button>
                          </div>
                        </div>
                        {timeSlots.length > 1 && (
                          <button
                            onClick={() => removeTimeSlot(index)}
                            className="bg-red-500 text-white px-3 py-2 rounded text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addTimeSlot}
                      className="bg-blue-500 text-white px-3 py-2 rounded text-sm mt-2"
                    >
                      Add Time Slot
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}
                {selectedUnit === 'hourly' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Total Hours: {quantity.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {selectedMachine && selectedUnit && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Rate per {selectedUnit}:</span>
                  <span className="font-semibold">
                    {formatCurrency(prices[selectedMachine as keyof typeof prices][selectedUnit as keyof typeof prices[keyof typeof prices]])}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(
                      quantity * prices[selectedMachine as keyof typeof prices][selectedUnit as keyof typeof prices[keyof typeof prices]]
                    )}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={createRental}
              disabled={!selectedMachine || !selectedUnit || !customerName || !customerContact || !customerAddress || loading}
              className="w-full bg-green-500 text-white p-3 rounded-lg disabled:bg-gray-300"
            >
              {loading ? 'Adding...' : 'Add Rental Entry'}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Enter expense description"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 border rounded-lg"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Diesel Cost (Optional)</label>
                  <input
                    type="number"
                    value={expenseDieselCost}
                    onChange={(e) => setExpenseDieselCost(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maintenance Cost (Optional)</label>
                  <input
                    type="number"
                    value={expenseMaintenanceCost}
                    onChange={(e) => setExpenseMaintenanceCost(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Operator Salary (Optional)</label>
                  <input
                    type="number"
                    value={expenseOperatorSalary}
                    onChange={(e) => setExpenseOperatorSalary(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
              <button
                onClick={saveExpense}
                disabled={loading || (!expenseDescription && !expenseAmount && !expenseDieselCost && !expenseMaintenanceCost && !expenseOperatorSalary)}
                className="w-full bg-green-500 text-white p-3 rounded-lg disabled:bg-gray-300"
              >
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">All Expenses</h3>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-gray-500">No expenses recorded yet.</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{expense.description}</div>
                        <div className="font-semibold text-red-600">{formatCurrency(expense.amount)}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Operator: {expense.operator.name}</div>
                        <div>Date: {new Date(expense.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rentals' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Recent Rentals</h2>
            <div className="space-y-3">
              {rentals
                .filter(r => r.operator.name === user.name)
                .slice(0, 5)
                .map((rental) => (
                  <div key={rental.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium capitalize">{rental.machineType}</div>
                      <div className="font-semibold text-green-600">{formatCurrency(rental.totalAmount)}</div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Customer: {rental.customer.name} ({rental.customer.contactNumber})</div>
                      <div>Location: {rental.customer.address || 'N/A'}</div>
                      <div>Date: {new Date(rental.date).toLocaleDateString()}</div>
                      <div>Quantity: {rental.quantity} {rental.unitType}</div>
                      {(rental as any).description && <div>Description: {(rental as any).description}</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
