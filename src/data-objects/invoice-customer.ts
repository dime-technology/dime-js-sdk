import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoiceCustomer {
  constructor(
    public readonly id?: number,
    public readonly name?: string,
    public readonly email?: string,
  ) {}

  static fromRaw(data: Raw): InvoiceCustomer {
    return new InvoiceCustomer(
      arrInt(data, 'id'),
      arrString(data, 'name'),
      arrString(data, 'email'),
    )
  }
}
