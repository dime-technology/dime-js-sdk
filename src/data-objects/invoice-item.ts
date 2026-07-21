import { arrBool, arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoiceItem {
  constructor(
    public readonly id?: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly price?: string,
    public readonly taxDeductible: boolean = false,
  ) {}

  static fromRaw(data: Raw): InvoiceItem {
    return new InvoiceItem(
      arrInt(data, 'id'),
      arrString(data, 'name'),
      arrString(data, 'description'),
      arrString(data, 'price'),
      arrBool(data, 'tax_deductible'),
    )
  }
}
