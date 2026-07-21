import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentUrl } from '../helpers.js'

const recurringBody = {
  id: 1,
  status: 'Active',
  recurrence_schedule: 'Monthly',
  payment_terms: 'net_15',
  start_date: '2026-08-15',
  end_date: null,
  next_run_date: '2026-08-15',
  last_run_date: null,
  thank_you_note: null,
  customer: { id: 52, name: 'Shawn Maida', email: 'shawn.maida@fostermade.co' },
  items: [{ id: 1, item_id: 96, name: 'General', description: null, quantity: 1, unit_price: 100, amount: 100 }],
  upcoming_run_dates: ['2026-08-15', '2026-09-15', '2026-10-15'],
  invoices: [{ id: 7, invoice_number: 'INV-0007', status: 'sent', total: 100, issue_date: '2026-08-15', public_url: 'http://relictum.test/invoice/x' }],
}

const summaryBody = {
  id: 1,
  status: 'Active',
  recurrence_schedule: 'Monthly',
  payment_terms: 'net_15',
  start_date: '2026-08-15',
  end_date: null,
  next_run_date: '2026-08-15',
  last_run_date: null,
  customer_name: 'Shawn Maida',
}

describe('RecurringInvoices', () => {
  it('list sends filters and returns a CursorPage of summaries', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: [summaryBody], meta: {} } },
    ])

    const page = await client.recurringInvoices.list('000010', { status: 'Active' })

    expect(sentUrl(calls)).toContain('recurring-invoices')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010' },
      filters: { status: 'Active' },
    })
    expect(page.data[0]?.status).toBe('Active')
    expect(page.data[0]?.customerName).toBe('Shawn Maida')
  })

  it('show sends recurring_invoice_id and maps template details', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: recurringBody } }])

    const template = await client.recurringInvoices.show('000010', 3)

    expect(sentUrl(calls)).toContain('recurring-invoice')
    expect(sentBody(calls)).toEqual({ data: { sid: '000010', recurring_invoice_id: 3 } })
    expect(template.recurrenceSchedule).toBe('Monthly')
    expect(template.customer.email).toBe('shawn.maida@fostermade.co')
    expect(template.items[0]?.unitPrice).toBe('100')
    expect(template.upcomingRunDates).toEqual(['2026-08-15', '2026-09-15', '2026-10-15'])
    expect(template.invoices[0]?.invoiceNumber).toBe('INV-0007')
  })

  it('create sends attributes (including lines) via POST', async () => {
    const { client, calls } = fakeClient([{ status: 201, body: { data: recurringBody } }])

    const template = await client.recurringInvoices.create('000010', {
      customer_id: 88,
      payment_terms: 'net_15',
      recurring_frequency: 'Monthly',
      recurring_start_date: '2026-08-01',
      lines: [{ item_id: 5, name: 'Monthly retainer', quantity: 1, unit_price: 500 }],
    })

    expect(sentUrl(calls)).toContain('recurring-invoice/create')
    const body = sentBody(calls) as Record<string, Record<string, unknown>>
    expect(body['data']?.['recurring_frequency']).toBe('Monthly')
    expect(body['data']?.['lines']).toHaveLength(1)
    expect(template.id).toBe(1)
  })

  it('cancel POSTs recurring_invoice_id to recurring-invoice/cancel', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: recurringBody } }])

    await client.recurringInvoices.cancel('000010', 3)

    expect(sentUrl(calls)).toContain('recurring-invoice/cancel')
    expect(sentBody(calls)).toEqual({ data: { sid: '000010', recurring_invoice_id: 3 } })
  })
})
