import { FormLink } from '../data-objects/form-link.js'
import { Merchant } from '../data-objects/merchant.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class Merchants extends AbstractResource {
  async list(filters: Raw = {}): Promise<CursorPage<Merchant>> {
    return this.paginate('GET', 'merchant/list', this.envelope({}, filters), Merchant.fromRaw)
  }

  async show(sid: string): Promise<Merchant> {
    const raw = await this.transport.request('GET', 'merchant/show', this.envelope({ sid }))
    return Merchant.fromRaw((raw['data'] as Raw) ?? {})
  }

  async create(attributes: Raw): Promise<Merchant> {
    const raw = await this.transport.request('POST', 'merchant/create', this.envelope(attributes))
    return Merchant.fromRaw((raw['data'] as Raw) ?? {})
  }

  async update(sid: string, attributes: Raw): Promise<Merchant> {
    const raw = await this.transport.request(
      'PATCH',
      'merchant/update',
      this.envelope({ sid, ...attributes }),
    )
    return Merchant.fromRaw((raw['data'] as Raw) ?? {})
  }

  async getFormLink(sid: string): Promise<FormLink> {
    const raw = await this.transport.request(
      'GET',
      'merchant/get-form-link',
      this.envelope({ sid }),
    )
    return FormLink.fromRaw((raw['data'] as Raw) ?? {})
  }
}
