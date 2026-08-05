import { Address } from '../data-objects/address.js'
import { MessageResult } from '../data-objects/message-result.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class Addresses extends AbstractResource {
  async list(sid: string, uuid: string): Promise<CursorPage<Address>> {
    return this.paginate('GET', 'address/list', this.envelope({ sid, uuid }), Address.fromRaw)
  }

  async show(sid: string, uuid: string, addressId: number | string): Promise<Address> {
    const raw = await this.transport.request(
      'GET',
      'address/show',
      this.envelope({ sid, uuid, address_id: addressId }),
    )
    return Address.fromRaw((raw['data'] as Raw) ?? {})
  }

  async create(sid: string, uuid: string, attributes: Raw): Promise<Address> {
    const raw = await this.transport.request(
      'POST',
      'address/create',
      this.envelope({ sid, uuid, ...attributes }),
    )
    return Address.fromRaw((raw['data'] as Raw) ?? {})
  }

  async update(
    sid: string,
    uuid: string,
    addressId: number | string,
    attributes: Raw,
  ): Promise<Address> {
    const raw = await this.transport.request(
      'PATCH',
      'address/update',
      this.envelope({ sid, uuid, address_id: addressId, ...attributes }),
    )
    return Address.fromRaw((raw['data'] as Raw) ?? {})
  }

  async delete(sid: string, uuid: string, addressId: number | string): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'address/delete',
      this.envelope({ sid, uuid, address_id: addressId }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }
}
