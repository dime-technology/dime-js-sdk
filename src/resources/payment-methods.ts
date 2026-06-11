import { MessageResult } from '../data-objects/message-result.js'
import { PaymentMethod } from '../data-objects/payment-method.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class PaymentMethods extends AbstractResource {
  async list(sid: string, filters: Raw): Promise<CursorPage<PaymentMethod>> {
    return this.paginate('GET', 'payment-method/list', this.envelope({ sid }, filters), PaymentMethod.fromRaw)
  }

  async show(sid: string, paymentMethodId: number | string, filters: Raw): Promise<PaymentMethod> {
    const raw = await this.transport.request('GET', 'payment-method/show', this.envelope({ sid, payment_method_id: paymentMethodId }, filters))
    return PaymentMethod.fromRaw((raw['data'] as Raw) ?? {})
  }

  async create(sid: string, attributes: Raw): Promise<PaymentMethod> {
    const raw = await this.transport.request('POST', 'payment-method/create', this.envelope({ sid, ...attributes }))
    return PaymentMethod.fromRaw((raw['data'] as Raw) ?? {})
  }

  async update(sid: string, attributes: Raw): Promise<PaymentMethod> {
    const raw = await this.transport.request('PATCH', 'payment-method/update', this.envelope({ sid, ...attributes }))
    return PaymentMethod.fromRaw((raw['data'] as Raw) ?? {})
  }

  async delete(sid: string, paymentMethodId: number | string, uuid: string): Promise<MessageResult> {
    const raw = await this.transport.request('POST', 'payment-method/delete', this.envelope({ sid, payment_method_id: paymentMethodId, uuid }))
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }
}
