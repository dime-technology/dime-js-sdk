import { Customer } from '../data-objects/customer.js'
import { MessageResult } from '../data-objects/message-result.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class Customers extends AbstractResource {
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Customer>> {
    return this.paginate('GET', 'customer/list', this.envelope({ sid }, filters), Customer.fromRaw)
  }

  async show(sid: string, filters: Raw): Promise<Customer> {
    const raw = await this.transport.request('GET', 'customer/show', this.envelope({ sid }, filters))
    return Customer.fromRaw((raw['data'] as Raw) ?? {})
  }

  async create(sid: string, attributes: Raw): Promise<Customer> {
    const raw = await this.transport.request('POST', 'customer/create', this.envelope({ sid, ...attributes }))
    return Customer.fromRaw((raw['data'] as Raw) ?? {})
  }

  async update(sid: string, filters: Raw, attributes: Raw): Promise<Customer> {
    const raw = await this.transport.request('PATCH', 'customer/update', this.envelope({ sid, ...attributes }, filters))
    return Customer.fromRaw((raw['data'] as Raw) ?? {})
  }

  async delete(sid: string, filters: Raw): Promise<MessageResult> {
    const raw = await this.transport.request('POST', 'customer/delete', this.envelope({ sid }, filters))
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }
}
