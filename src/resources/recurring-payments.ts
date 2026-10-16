import { MessageResult } from '../data-objects/message-result.js'
import { RecurringPayment } from '../data-objects/recurring-payment.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class RecurringPayments extends AbstractResource {
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<RecurringPayment>> {
    return this.paginate(
      'GET',
      'recurring-payment/list',
      this.envelope({ sid }, filters),
      RecurringPayment.fromRaw,
    )
  }

  async show(sid: string, recurringPaymentId: number | string): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'GET',
      'recurring-payment/show',
      this.envelope({ sid, recurring_payment_id: recurringPaymentId }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Create a recurring payment schedule.
   *
   * @param attributes `name`, `amount`, `start_date`, `recurrence_schedule`,
   *   `payment_method`, `customer_uuid` (required); `end_date`,
   *   `shipping_address`; `customer_covers_fee` — true treats `amount` as what
   *   the merchant nets and adds the processing fee on top of each charge;
   *   `item_id` — the item (designation) each run is credited to, omit or null
   *   for the merchant's default item.
   */
  async create(sid: string, attributes: Raw): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'POST',
      'recurring-payment/create',
      this.envelope({ sid, ...attributes }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Edit a recurring payment schedule. Omitted keys are left unchanged.
   *
   * @param attributes any of the `create` keys. `customer_covers_fee` true turns
   *   fee coverage on (grossing up `amount`, or the current amount) and false
   *   turns it off. `item_id` re-pins the item (designation); `item_id: null`
   *   unpins it, so each run is credited to whatever the merchant's default item
   *   is at the time. Unlike every other key, an explicit null `item_id` is sent
   *   rather than dropped.
   */
  async edit(
    sid: string,
    recurringPaymentId: number | string,
    attributes: Raw,
  ): Promise<RecurringPayment> {
    const body = this.envelope({ sid, recurring_payment_id: recurringPaymentId, ...attributes })
    if ('item_id' in attributes && attributes['item_id'] === null) {
      const data = body['data'] as Raw
      data['item_id'] = null
    }
    const raw = await this.transport.request('PATCH', 'recurring-payment/edit', body)
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  async pause(
    sid: string,
    recurringPaymentId: number | string,
    pauseUntilDate?: string,
  ): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'PATCH',
      'recurring-payment/pause',
      this.envelope({
        sid,
        recurring_payment_id: recurringPaymentId,
        pause_until_date: pauseUntilDate,
      }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  async cancel(sid: string, recurringPaymentId: number | string): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'PATCH',
      'recurring-payment/cancel',
      this.envelope({ sid, recurring_payment_id: recurringPaymentId }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  async activate(sid: string, recurringPaymentId: number | string): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'PATCH',
      'recurring-payment/activate',
      this.envelope({ sid, recurring_payment_id: recurringPaymentId }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  async delete(sid: string, recurringPaymentId: number | string): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'recurring-payment/delete',
      this.envelope({ sid, recurring_payment_id: recurringPaymentId }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }
}
