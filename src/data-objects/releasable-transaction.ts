import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A payment that can be released from a held balance. `amount` is what
 * releasing it pays the merchant: `netAmount` less `splitAmount`.
 */
export class ReleasableTransaction {
  constructor(
    public readonly transactionInfoId?: string,
    public readonly type?: string,
    public readonly transactionDate?: string,
    public readonly grossAmount?: string,
    public readonly netAmount?: string,
    public readonly splitAmount?: string,
    public readonly amount?: string,
  ) {}

  static fromRaw(data: Raw): ReleasableTransaction {
    return new ReleasableTransaction(
      arrString(data, 'transaction_info_id'),
      arrString(data, 'type'),
      arrString(data, 'transaction_date'),
      arrString(data, 'gross_amount'),
      arrString(data, 'net_amount'),
      arrString(data, 'split_amount'),
      arrString(data, 'amount'),
    )
  }
}
