'use client'

import { useState, useEffect } from 'react'
import { Minus, LogIn, BarChart3, Trash2, Plus } from 'lucide-react'
import { DummyCustomer, getDummyCustomerByContact } from '@/lib/dummy-data'

const STANDARD_PRICES = {
  tractor: { hourly: 500, trip: 2000, acre: 300 },
  harvester: { hourly: 800, trip: 3500, acre: 450 },
  excavator: { hourly: 700, trip: 3000, acre: 400 }
}

const MACHINES = [
  { id: 'harvester', name: 'Harvester', units: ['hourly', 'acre'] },
  { id: 'excavator', name: 'Excavator', units: ['hourly', 'trip'] },
  { id: 'tractor', name: 'Tractor', units: ['hourly', 'trip'] }
]

const UNITS = ['hourly', 'trip', 'acre']

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

export default function Home() {
  const [pin, setPin] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(`2000-01-01T${start}:00`)
    const endDate = new Date(`2000-01-01T${end}:00`)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours)
  }
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  const [dieselCost, setDieselCost] = useState('')
  const [maintenanceCost, setMaintenanceCost] = useState('')
  const [operatorSalary, setOperatorSalary] = useState('')
  const [otherExpenses, setOtherExpenses] = useState<{ key: string; value: string }[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [customers, setCustomers] = useState<DummyCustomer[]>([])
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
  const [editRentalData, setEditRentalData] = useState({
    machineType: '',
    unitType: '',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    customerName: '',
    customerContact: '',
    customerAddress: '',
    dieselCost: '',
    maintenanceCost: '',
    operatorSalary: ''
  })
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
    if (!expenseDescription || !expenseAmount || !user) return

    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDescription,
          amount: expenseAmount,
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
        setStartTime('')
        setEndTime('')
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

  if (user.role === 'admin') {
    return (
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
                    <div className="flex gap-4">
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
                <div className="flex gap-4 flex-wrap">
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
        </div>
      </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {MACHINES.map((machine) => (
                <button
                  key={machine.id}
                  onClick={() => setSelectedMachine(machine.id)}
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
                                  newPrices[machine.id as keyof typeof prices][unit as keyof typeof prices[keyof typeof prices]] = parseInt(e.target.value) || 0
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
                {selectedUnit === 'acre' ? (
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="Enter quantity (e.g., 1.45)"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                ) : selectedUnit === 'hourly' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value)
                          const hours = calculateHours(e.target.value, endTime)
                          setQuantity(hours)
                        }}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value)
                          const hours = calculateHours(startTime, e.target.value)
                          setQuantity(hours)
                        }}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
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
                {selectedUnit === 'hourly' && startTime && endTime && (
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
