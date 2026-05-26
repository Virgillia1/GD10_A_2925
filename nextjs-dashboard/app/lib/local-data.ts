import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
} from './definitions';
import {
  customers as seedCustomers,
  invoices as seedInvoices,
  revenue,
} from './placeholder-data';
import { formatCurrency } from './utils';

const ITEMS_PER_PAGE = 6;

type LocalInvoice = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
  date: string;
};

let invoices: LocalInvoice[] = seedInvoices.map((invoice) => ({
  ...invoice,
  status: invoice.status as 'pending' | 'paid',
}));

function invoiceWithCustomer(invoice: LocalInvoice): InvoicesTable {
  const customer = seedCustomers.find(
    (customer) => customer.id === invoice.customer_id,
  );

  return {
    id: invoice.id,
    customer_id: invoice.customer_id,
    amount: invoice.amount,
    date: invoice.date,
    status: invoice.status,
    name: customer?.name ?? 'Unknown Customer',
    email: customer?.email ?? '',
    image_url: customer?.image_url ?? '/customers/evil-rabbit.png',
  };
}

function matchesQuery(invoice: InvoicesTable, query: string) {
  const normalizedQuery = query.toLowerCase();

  return [
    invoice.name,
    invoice.email,
    invoice.amount.toString(),
    invoice.date,
    invoice.status,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function fetchLocalRevenue() {
  return revenue;
}

export function fetchLocalLatestInvoices() {
  return invoices
    .map(invoiceWithCustomer)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map<LatestInvoiceRaw>((invoice) => ({
      id: invoice.id,
      name: invoice.name,
      image_url: invoice.image_url,
      email: invoice.email,
      amount: invoice.amount,
    }))
    .map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
}

export function fetchLocalCardData() {
  const totalPaid = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPending = invoices
    .filter((invoice) => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return {
    numberOfCustomers: seedCustomers.length,
    numberOfInvoices: invoices.length,
    totalPaidInvoices: formatCurrency(totalPaid),
    totalPendingInvoices: formatCurrency(totalPending),
  };
}

export function fetchLocalFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  return invoices
    .map(invoiceWithCustomer)
    .filter((invoice) => matchesQuery(invoice, query))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(offset, offset + ITEMS_PER_PAGE);
}

export function fetchLocalInvoicesPages(query: string) {
  const totalInvoices = invoices
    .map(invoiceWithCustomer)
    .filter((invoice) => matchesQuery(invoice, query)).length;

  return Math.ceil(totalInvoices / ITEMS_PER_PAGE);
}

export function fetchLocalInvoiceById(id: string): InvoiceForm | undefined {
  const invoice = invoices.find((invoice) => invoice.id === id);

  if (!invoice) {
    return undefined;
  }

  return {
    id: invoice.id,
    customer_id: invoice.customer_id,
    amount: invoice.amount / 100,
    status: invoice.status,
  };
}

export function fetchLocalCustomers(): CustomerField[] {
  return [...seedCustomers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
    }));
}

export function fetchLocalFilteredCustomers(query: string) {
  const normalizedQuery = query.toLowerCase();

  return seedCustomers
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map<CustomersTableType>((customer) => {
      const customerInvoices = invoices.filter(
        (invoice) => invoice.customer_id === customer.id,
      );
      const totalPending = customerInvoices
        .filter((invoice) => invoice.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      const totalPaid = customerInvoices
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        total_invoices: customerInvoices.length,
        total_pending: totalPending,
        total_paid: totalPaid,
      };
    })
    .map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending) as never,
      total_paid: formatCurrency(customer.total_paid) as never,
    }));
}

export function createLocalInvoice({
  customerId,
  amount,
  status,
}: {
  customerId: string;
  amount: number;
  status: 'pending' | 'paid';
}) {
  invoices.unshift({
    id: crypto.randomUUID(),
    customer_id: customerId,
    amount,
    status,
    date: new Date().toISOString().split('T')[0],
  });
}

export function updateLocalInvoice({
  id,
  customerId,
  amount,
  status,
}: {
  id: string;
  customerId: string;
  amount: number;
  status: 'pending' | 'paid';
}) {
  invoices = invoices.map((invoice) =>
    invoice.id === id
      ? {
          ...invoice,
          customer_id: customerId,
          amount,
          status,
        }
      : invoice,
  );
}

export function deleteLocalInvoice(id: string) {
  invoices = invoices.filter((invoice) => invoice.id !== id);
}
