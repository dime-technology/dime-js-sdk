import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoiceLineItem {
  constructor(
    public readonly id?: number,
    public readonly itemId?: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly quantity?: string,
    public readonly unitPrice?: string,
    public readonly amount?: string,
  ) {}

  static fromRaw(data: Raw): InvoiceLineItem {
    return new InvoiceLineItem(
      arrInt(data, 'id'),
      arrInt(data, 'item_id'),
      arrString(data, 'name'),
      arrString(data, 'description'),
      arrString(data, 'quantity'),
      arrString(data, 'unit_price'),
      arrString(data, 'amount'),
    )
  }
}
