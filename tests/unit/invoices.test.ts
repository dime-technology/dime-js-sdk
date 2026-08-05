import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const invoiceBody = {
  id: 1,
  token: 'keNlDtg1qYTFUyFrmHlEJAW6mdlwZCR2DmdkB4GT',
  invoice_number: 'INV-0001',
  status: 'sent',
  payment_terms: 'net_15',
  issue_date: '2026-07-20',
  due_date: '2026-08-04',
  is_overdue: false,
  subtotal: 300,
  total: 300,
  amount_paid: 0,
  balance: 300,
  allow_partial_payment: true,
  thank_you_note: 'Thanks for your support!',
  public_url: 'http://relictum.test/invoice/keNlDtg1qYTFUyFrmHlEJAW6mdlwZCR2DmdkB4GT',
  customer: { id: 52, name: 'Shawn Maida', email: 'shawn.maida@fostermade.co' },
  items: [
    {
      id: 1,
      item_id: 96,
      name: 'General',
      description: null,
      quantity: 2,
      unit_price: 125,
      amount: 250,
    },
    {
      id: 2,
      item_id: 397,
      name: 'Online',
      description: null,
      quantity: 1,
      unit_price: 50,
      amount: 50,
    },
  ],
  payments: [
    { amount: 50, paid_at: '2026-07-21T09:00:00-04:00', method: 'cc', transaction_id: 'TXN9' },
  ],
  events: [
    {
      type: 'sent',
      label: 'Invoice sent',
      description: 'Marked as sent via API',
      created_at: '2026-07-20T10:18:43-04:00',
    },
  ],
}

const summaryBody = {
  id: 1,
  invoice_number: 'INV-0001',
  status: 'sent',
  customer_name: 'Shawn Maida',
  customer_email: 'shawn.maida@fostermade.co',
  total: 300,
  amount_paid: 0,
  balance: 300,
  issue_date: '2026-07-20',
  due_date: '2026-08-04',
  is_overdue: false,
  public_url: 'http://relictum.test/invoice/abcd',
}

describe('Invoices', () => {
  it('list sends filters and returns a CursorPage of summaries', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: [summaryBody], meta: {} } }])

    const page = await client.invoices.list('000010', { status: 'sent' })

    expect(sentUrl(calls)).toContain('invoices')
    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'filters[status]': 'sent',
    })
    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.invoiceNumber).toBe('INV-0001')
    expect(page.data[0]?.customerName).toBe('Shawn Maida')
    expect(page.data[0]?.balance).toBe('300')
  })

  it('show sends invoice_id and maps nested items, customer, payments, events', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    const invoice = await client.invoices.show('000010', 42)

    expect(sentUrl(calls)).toContain('invoice')
    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010', 'data[invoice_id]': '42' })
    expect(invoice.id).toBe(1)
    expect(invoice.total).toBe('300')
    expect(invoice.allowPartialPayment).toBe(true)
    expect(invoice.customer.name).toBe('Shawn Maida')
    expect(invoice.items).toHaveLength(2)
    expect(invoice.items[0]?.itemId).toBe(96)
    expect(invoice.items[0]?.amount).toBe('250')
    expect(invoice.payments[0]?.transactionId).toBe('TXN9')
    expect(invoice.events[0]?.type).toBe('sent')
  })

  it('create sends sid and attributes (including lines) in the data envelope', async () => {
    const { client, calls } = fakeClient([{ status: 201, body: { data: invoiceBody } }])

    const invoice = await client.invoices.create('000010', {
      customer_id: 88,
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      payment_terms: 'net_15',
      lines: [{ item_id: 5, name: 'Consulting', quantity: 2, unit_price: 125 }],
    })

    expect(sentUrl(calls)).toContain('invoice/create')
    expect(calls[0]?.method).toBe('POST')
    const body = sentBody(calls) as Record<string, Record<string, unknown>>
    expect(body['data']?.['sid']).toBe('000010')
    expect(body['data']?.['lines']).toHaveLength(1)
    expect(invoice.invoiceNumber).toBe('INV-0001')
  })

  it('create forwards customer_uuid so a Customer links without its integer id', async () => {
    const { client, calls } = fakeClient([{ status: 201, body: { data: invoiceBody } }])

    await client.invoices.create('000010', {
      customer_uuid: '9f2a6c14-3e8b-4d21-9a77-5c1e0b8f4d33',
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      payment_terms: 'net_15',
      lines: [{ item_id: 5, name: 'Consulting', quantity: 2, unit_price: 125 }],
    })

    const body = sentBody(calls) as Record<string, Record<string, unknown>>
    expect(body['data']?.['customer_uuid']).toBe('9f2a6c14-3e8b-4d21-9a77-5c1e0b8f4d33')
    expect(body['data']).not.toHaveProperty('customer_id')
  })

  it('update sends invoice_id and attributes via PATCH', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.update('000010', 42, { payment_terms: 'net_30' })

    expect(calls[0]?.method).toBe('PATCH')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', invoice_id: 42, payment_terms: 'net_30' },
    })
  })

  it('delete sends POST and returns a MessageResult', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Draft invoice deleted.' } } },
    ])

    const result = await client.invoices.delete('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/delete')
    expect(result.message).toBe('Draft invoice deleted.')
  })

  it('send POSTs to invoice/send and returns the invoice', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    const invoice = await client.invoices.send('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/send')
    expect(invoice.status).toBe('sent')
  })

  it('markSent POSTs to invoice/mark-sent', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.markSent('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/mark-sent')
    expect(calls[0]?.method).toBe('POST')
  })

  it('void sends PATCH to invoice/void', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.void('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/void')
    expect(calls[0]?.method).toBe('PATCH')
  })

  it('duplicate POSTs to invoice/duplicate', async () => {
    const { client, calls } = fakeClient([{ status: 201, body: { data: invoiceBody } }])

    await client.invoices.duplicate('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/duplicate')
  })

  it('pay sends payment attributes and returns the invoice', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.pay('000010', 42, {
      payment_type: 'cc',
      amount: 100,
      token: 'abc123',
      billing_address: { zip: '30004' },
    })

    expect(sentUrl(calls)).toContain('invoice/pay')
    expect(sentBody(calls)).toEqual({
      data: {
        sid: '000010',
        invoice_id: 42,
        payment_type: 'cc',
        amount: 100,
        token: 'abc123',
        billing_address: { zip: '30004' },
      },
    })
  })

  it('getLink returns an InvoiceLink', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: { data: { public_url: 'https://example.test/invoice/abcd', token: 'abcd' } },
      },
    ])

    const link = await client.invoices.getLink('000010', 42)

    expect(sentUrl(calls)).toContain('invoice/link')
    expect(link.publicUrl).toBe('https://example.test/invoice/abcd')
    expect(link.token).toBe('abcd')
  })

  it('addLineItem POSTs the line to invoice/line-item/add', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.addLineItem('000010', 42, {
      item_id: 5,
      name: 'Consulting',
      quantity: 2,
      unit_price: 125,
    })

    expect(sentUrl(calls)).toContain('invoice/line-item/add')
    expect(sentBody(calls)).toEqual({
      data: {
        sid: '000010',
        invoice_id: 42,
        item_id: 5,
        name: 'Consulting',
        quantity: 2,
        unit_price: 125,
      },
    })
  })

  it('updateLineItem sends line_item_id via PATCH', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.updateLineItem('000010', 42, 9, { quantity: 3 })

    expect(sentUrl(calls)).toContain('invoice/line-item/update')
    expect(calls[0]?.method).toBe('PATCH')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', invoice_id: 42, line_item_id: 9, quantity: 3 },
    })
  })

  it('deleteLineItem POSTs line_item_id', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: invoiceBody } }])

    await client.invoices.deleteLineItem('000010', 42, 9)

    expect(sentUrl(calls)).toContain('invoice/line-item/delete')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', invoice_id: 42, line_item_id: 9 },
    })
  })

  it('listItems returns a plain array of InvoiceItem', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: { data: [{ id: 5, name: 'Consulting', description: null, price: 125 }] },
      },
    ])

    const items = await client.invoices.listItems('000010')

    expect(sentUrl(calls)).toContain('invoice/items')
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe(5)
    expect(items[0]?.name).toBe('Consulting')
    expect(items[0]?.price).toBe('125')
  })

  it('createItem returns an InvoiceItem with tax_deductible mapped', async () => {
    const { client, calls } = fakeClient([
      {
        status: 201,
        body: {
          data: { id: 5, name: 'Consulting', description: null, price: 125, tax_deductible: false },
        },
      },
    ])

    const item = await client.invoices.createItem('000010', { name: 'Consulting', price: 125 })

    expect(sentUrl(calls)).toContain('invoice/item/create')
    expect(item.id).toBe(5)
    expect(item.taxDeductible).toBe(false)
  })
})
