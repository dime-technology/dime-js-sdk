import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoiceLink {
  constructor(
    public readonly publicUrl?: string,
    public readonly token?: string,
  ) {}

  static fromRaw(data: Raw): InvoiceLink {
    return new InvoiceLink(arrString(data, 'public_url'), arrString(data, 'token'))
  }
}
