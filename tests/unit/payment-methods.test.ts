import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const pmBody = {
  id: 42,
  type: 'cc',
  cc_last_four: '4242',
  cc_brand: 'Visa',
  enabled: true,
  default: true,
}

describe('PaymentMethods', () => {
  it('create maps response correctly', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: pmBody } }])

    const pm = await client.paymentMethods.create('000010', {
      uuid: 'cust-uuid-1',
      type: 'cc',
      cc_number: '4242424242424242',
      cc_expiration_date: '01/2027',
    })

    expect(pm.id).toBe(42)
    expect(pm.ccLastFour).toBe('4242')
    expect(pm.ccBrand).toBe('Visa')
    expect(pm.isDefault).toBe(true)
  })

  it('show passes payment_method_id and filters', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: pmBody } }])

    await client.paymentMethods.show('000010', 42, { uuid: 'cust-uuid-1' })

    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'data[payment_method_id]': '42',
      'filters[uuid]': 'cust-uuid-1',
    })
  })

  it('delete sends POST with correct envelope', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Payment Method successfully deleted' } } },
    ])

    const result = await client.paymentMethods.delete('000010', 42, 'cust-uuid-1')

    expect(sentUrl(calls)).toContain('payment-method/delete')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', payment_method_id: 42, uuid: 'cust-uuid-1' },
    })
    expect(result.message).toBe('Payment Method successfully deleted')
  })

  it('list returns CursorPage', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: [pmBody], meta: {} } }])

    const page = await client.paymentMethods.list('000010', { uuid: 'cust-uuid-1' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.ccBrand).toBe('Visa')
  })
})
