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

  async create(sid: string, attributes: Raw): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'POST',
      'recurring-payment/create',
      this.envelope({ sid, ...attributes }),
    )
    return RecurringPayment.fromRaw((raw['data'] as Raw) ?? {})
  }

  async edit(
    sid: string,
    recurringPaymentId: number | string,
    attributes: Raw,
  ): Promise<RecurringPayment> {
    const raw = await this.transport.request(
      'PATCH',
      'recurring-payment/edit',
      this.envelope({ sid, recurring_payment_id: recurringPaymentId, ...attributes }),
    )
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
