import { describe, expect, it } from 'vitest'
import { RecurringPaymentItem } from '../../src/index.js'
import { fakeClient, sentBody } from '../helpers.js'

const rpBody = {
  id: 5,
  name: 'Monthly donation',
  amount: '25.00',
  start_date: '2026-07-01 00:00:00',
  recurrence_schedule: 'Monthly',
  status: 'Active',
  payment_method: { id: 42, type: 'cc' },
  shipping_address: {},
}

describe('RecurringPayments', () => {
  it('create maps response', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: rpBody } }])

    const rp = await client.recurringPayments.create('000010', {
      name: 'Monthly donation',
      amount: '25.00',
      start_date: '2026-07-01 00:00:00',
      recurrence_schedule: 'Monthly',
      payment_method: 42,
      customer_uuid: 'cust-uuid-1',
    })

    expect(rp.id).toBe(5)
    expect(rp.amount).toBe('25.00')
    expect(rp.paymentMethod.id).toBe(42)
  })

  it('pause sends pause_until_date', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.pause('000010', 5, '2026-09-01 00:00:00')

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', recurring_payment_id: 5, pause_until_date: '2026-09-01 00:00:00' },
    })
  })

  it('pause without date omits pause_until_date from envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.pause('000010', 5)

    // null values are pruned by envelope()
    expect((sentBody(calls) as Record<string, unknown>)?.['data']).not.toHaveProperty(
      'pause_until_date',
    )
  })

  it('cancel sends PATCH to correct path', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.cancel('000010', 5)

    expect(calls[0]?.url).toContain('recurring-payment/cancel')
  })

  it('delete returns MessageResult', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: { message: 'Deleted' } } }])

    const result = await client.recurringPayments.delete('000010', 5)

    expect(result.message).toBe('Deleted')
  })

  it('list returns CursorPage', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: [rpBody], meta: {} } }])

    const page = await client.recurringPayments.list('000010')

    expect(page.data[0]?.name).toBe('Monthly donation')
  })

  it('reads the pinned item and the covered fee', async () => {
    const { client } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            ...rpBody,
            cover_processing_amount: '0.75',
            item: { id: 42, name: 'Building Fund' },
          },
        },
      },
    ])

    const rp = await client.recurringPayments.show('000010', 5)

    expect(rp.coverProcessingAmount).toBe('0.75')
    expect(rp.item).toBeInstanceOf(RecurringPaymentItem)
    expect(rp.item?.id).toBe(42)
    expect(rp.item?.name).toBe('Building Fund')
  })

  it('reads an unpinned payment as no item', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: { ...rpBody, cover_processing_amount: null, item: null } } },
    ])

    const rp = await client.recurringPayments.show('000010', 5)

    expect(rp.item).toBeUndefined()
    expect(rp.coverProcessingAmount).toBeUndefined()
  })

  it('keeps an item id whose name is not disclosed', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: { ...rpBody, item: { id: 42, name: null } } } },
    ])

    const rp = await client.recurringPayments.show('000010', 5)

    expect(rp.item?.id).toBe(42)
    expect(rp.item?.name).toBeUndefined()
  })

  it('create sends item_id and customer_covers_fee', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.create('000010', {
      name: 'Monthly donation',
      amount: '25.00',
      start_date: '2026-07-01 00:00:00',
      recurrence_schedule: 'Monthly',
      payment_method: 42,
      customer_uuid: 'cust-uuid-1',
      customer_covers_fee: true,
      item_id: 42,
    })

    expect((sentBody(calls) as Record<string, Record<string, unknown>>)['data']).toMatchObject({
      customer_covers_fee: true,
      item_id: 42,
    })
  })

  it('edit sends a null item_id to unpin, and still drops other nulls', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.edit('000010', 5, { item_id: null, name: null })

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', recurring_payment_id: 5, item_id: null },
    })
  })

  it('edit leaves item_id out when it is not given', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: rpBody } }])

    await client.recurringPayments.edit('000010', 5, { amount: '30.00', item_id: undefined })

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', recurring_payment_id: 5, amount: '30.00' },
    })
  })
})
