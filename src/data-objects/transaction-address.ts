import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class TransactionAddress {
  constructor(
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly addr1?: string,
    public readonly addr2?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zip?: string,
  ) {}

  static fromRaw(data: Raw): TransactionAddress {
    return new TransactionAddress(
      arrString(data, 'first_name'),
      arrString(data, 'last_name'),
      arrString(data, 'addr1'),
      arrString(data, 'addr2'),
      arrString(data, 'city'),
      arrString(data, 'state'),
      arrString(data, 'zip'),
    )
  }
}
