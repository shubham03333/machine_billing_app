// Dummy data for testing UI without MySQL DB
// This will be removed when connecting to AWS MySQL

export interface DummyUser {
  id: number;
  name: string;
  role: string;
  pin: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DummyCustomer {
  id: number;
  name: string;
  contactNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DummyRental {
  id: number;
  machineType: string;
  unitType: string;
  quantity: number;
  acreage?: number;
  pricePerUnit: number;
  totalAmount: number;
  customerId: number;
  customer: {
    name: string;
    address: string;
    contactNumber: string;
  };
  operatorId: number;
  operator: {
    name: string;
  };
  date: Date;
  dieselCost: number;
  maintenanceCost: number;
  operatorSalary: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DummyExpense {
  id: number;
  description: string;
  amount: number;
  operatorId: number;
  operator: {
    name: string;
  };
  date: Date;
  dieselCost?: number;
  maintenanceCost?: number;
  operatorSalary?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const dummyUsers: DummyUser[] = [
  {
    id: 1,
    name: 'John Doe',
    role: 'admin',
    pin: '1234',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'operator',
    pin: '5678',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
  {
    id: 3,
    name: 'Bob Johnson',
    role: 'operator',
    pin: '9012',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
  },
];

export const dummyCustomers: DummyCustomer[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    contactNumber: '9876543210',
    address: 'Village Rampur, District Meerut, UP',
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-01'),
  },
  {
    id: 2,
    name: 'Sita Devi',
    contactNumber: '9876543211',
    address: 'Farm House, Sector 15, Gurgaon, Haryana',
    createdAt: new Date('2023-09-02'),
    updatedAt: new Date('2023-09-02'),
  },
  {
    id: 3,
    name: 'Mohan Singh',
    contactNumber: '9876543212',
    address: 'Plot 45, Industrial Area, Faridabad, Haryana',
    createdAt: new Date('2023-09-03'),
    updatedAt: new Date('2023-09-03'),
  },
  {
    id: 4,
    name: 'sura',
    contactNumber: '7558379425',
    address: 'bhi',
    createdAt: new Date('2023-09-04'),
    updatedAt: new Date('2023-09-04'),
  },
];

export const dummyRentals: DummyRental[] = [
  {
    id: 1,
    machineType: 'tractor',
    unitType: 'hourly',
    quantity: 5,
    pricePerUnit: 50,
    totalAmount: 250,
    customerId: 1,
    customer: { name: 'Rajesh Kumar', address: 'Village Rampur, District Meerut, UP', contactNumber: '9876543210' },
    operatorId: 2,
    operator: { name: 'Jane Smith' },
    date: new Date('2023-10-01'),
    dieselCost: 500,
    maintenanceCost: 200,
    operatorSalary: 300,
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-10-01'),
  },
  {
    id: 2,
    machineType: 'harvester',
    unitType: 'acre',
    quantity: 10,
    acreage: 2.5,
    pricePerUnit: 100,
    totalAmount: 1000,
    customerId: 2,
    customer: { name: 'Sita Devi', address: 'Farm House, Sector 15, Gurgaon, Haryana', contactNumber: '9876543211' },
    operatorId: 3,
    operator: { name: 'Bob Johnson' },
    date: new Date('2023-10-02'),
    dieselCost: 800,
    maintenanceCost: 150,
    operatorSalary: 400,
    createdAt: new Date('2023-10-02'),
    updatedAt: new Date('2023-10-02'),
  },
  {
    id: 3,
    machineType: 'excavator',
    unitType: 'trip',
    quantity: 3,
    pricePerUnit: 200,
    totalAmount: 600,
    customerId: 3,
    customer: { name: 'Mohan Singh', address: 'Plot 45, Industrial Area, Faridabad, Haryana', contactNumber: '9876543212' },
    operatorId: 2,
    operator: { name: 'Jane Smith' },
    date: new Date('2023-10-03'),
    dieselCost: 600,
    maintenanceCost: 100,
    operatorSalary: 350,
    createdAt: new Date('2023-10-03'),
    updatedAt: new Date('2023-10-03'),
  },
];

export const dummyExpenses: DummyExpense[] = [
  {
    id: 1,
    description: 'Diesel for tractor maintenance',
    amount: 500,
    operatorId: 2,
    operator: { name: 'Jane Smith' },
    date: new Date('2023-10-01'),
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-10-01'),
  },
  {
    id: 2,
    description: 'Maintenance parts for harvester',
    amount: 150,
    operatorId: 3,
    operator: { name: 'Bob Johnson' },
    date: new Date('2023-10-02'),
    createdAt: new Date('2023-10-02'),
    updatedAt: new Date('2023-10-02'),
  },
  {
    id: 3,
    description: 'Operator salary for excavator work',
    amount: 350,
    operatorId: 2,
    operator: { name: 'Jane Smith' },
    date: new Date('2023-10-03'),
    createdAt: new Date('2023-10-03'),
    updatedAt: new Date('2023-10-03'),
  },
];

// Helper functions to simulate database operations
export const getDummyRentals = (): DummyRental[] => {
  return [...dummyRentals];
};

export const addDummyRental = (rental: Omit<DummyRental, 'id' | 'createdAt' | 'updatedAt'>): DummyRental => {
  const newId = Math.max(...dummyRentals.map(r => r.id)) + 1;
  const newRental: DummyRental = {
    ...rental,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dummyRentals.push(newRental);
  return newRental;
};

export const deleteDummyRental = (id: number): boolean => {
  const index = dummyRentals.findIndex(r => r.id === id);
  if (index !== -1) {
    dummyRentals.splice(index, 1);
    return true;
  }
  return false;
};

export const getDummyUserByPin = (pin: string): DummyUser | null => {
  return dummyUsers.find(user => user.pin === pin) || null;
};

export const getDummyCustomers = (): DummyCustomer[] => {
  return [...dummyCustomers];
};

export const addDummyCustomer = (customer: Omit<DummyCustomer, 'id' | 'createdAt' | 'updatedAt'>): DummyCustomer => {
  const newId = Math.max(...dummyCustomers.map(c => c.id)) + 1;
  const newCustomer: DummyCustomer = {
    ...customer,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dummyCustomers.push(newCustomer);
  return newCustomer;
};

export const getDummyCustomerByName = (name: string): DummyCustomer | null => {
  return dummyCustomers.find(customer => customer.name.toLowerCase() === name.toLowerCase()) || null;
};

export const getDummyCustomerByContact = (contactNumber: string): DummyCustomer | null => {
  return dummyCustomers.find(customer => customer.contactNumber === contactNumber) || null;
};

export const getDummyExpenses = (): DummyExpense[] => {
  return [...dummyExpenses];
};

export const addDummyExpense = (expense: Omit<DummyExpense, 'id' | 'createdAt' | 'updatedAt'>): DummyExpense => {
  const newId = Math.max(...dummyExpenses.map(e => e.id)) + 1;
  const newExpense: DummyExpense = {
    ...expense,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dummyExpenses.push(newExpense);
  return newExpense;
};
