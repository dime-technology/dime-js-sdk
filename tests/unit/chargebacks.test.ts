import { describe, expect, it } from 'vitest'
import { fakeClient, sentQuery, sentUrl } from '../helpers.js'

const chargebackBody = {
  transaction_info_id: '1134722723',
  parent_transaction_info_id: '1132652128',
  gateway_transaction_id: null,
  transaction_number: '1566',
  invoice_number: null,
  chargeback_date: '2025-05-04T17:45:05-04:00',
  merchant_chargeback_date: '2025-05-04T19:45:05-04:00',
  transaction_amount: 391.48,
  chargeback_amount: 391.48,
  card_brand: 'V',
  cc_last_four: '2510',
  payee_name: null,
  days_to_represent: 0,
  representment_date: '2025-05-12T06:26:00-04:00',
  merchant_representment_date: '2025-05-05T07:32:01-04:00',
  representment_status: 'accepting chargeback',
  result: 'Accepting',
  chargeback_code: '4',
  chargeback_response_code: 'Other fraud - Card Absent Environment',
  resolved: false,
}

describe('Chargebacks', () => {
  it('list sends sid and filters as query params and returns a CursorPage', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: [chargebackBody],
          meta: { per_page: 500, next_cursor: 'abc', prev_cursor: null },
        },
      },
    ])

    const page = await client.chargebacks.list('000010', {
      start_date: '2026-04-01 00:00:00',
      end_date: '2026-04-30 23:59:59',
      representment_status: 'New',
    })

    expect(sentUrl(calls)).toContain('chargeback/list')
    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'filters[start_date]': '2026-04-01 00:00:00',
      'filters[end_date]': '2026-04-30 23:59:59',
      'filters[representment_status]': 'New',
    })
    expect(page.data).toHaveLength(1)
    expect(page.hasMore()).toBe(true)
  })

  it('show sends transaction_info_id and maps the chargeback', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: chargebackBody } }])

    const chargeback = await client.chargebacks.show('000010', '1134722723')

    expect(sentUrl(calls)).toContain('chargeback/show')
    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'data[transaction_info_id]': '1134722723',
    })
    expect(chargeback.transactionInfoId).toBe('1134722723')
    expect(chargeback.parentTransactionInfoId).toBe('1132652128')
    expect(chargeback.chargebackAmount).toBe('391.48')
    expect(chargeback.daysToRepresent).toBe(0)
    expect(chargeback.gatewayTransactionId).toBeUndefined()
    expect(chargeback.chargebackResponseCode).toBe('Other fraud - Card Absent Environment')
    expect(chargeback.resolved).toBe(false)
  })
})
