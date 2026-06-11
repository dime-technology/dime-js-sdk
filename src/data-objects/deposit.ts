import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class Deposit {
  constructor(
    public readonly transactionDate?: string,
    public readonly fundDate?: string,
    public readonly transactionInfoId?: string,
    public readonly transactionId?: string,
    public readonly transactionDetailAccount?: string,
    public readonly authorizationAmount?: string,
    public readonly netAmount?: string,
    public readonly sweepId?: string,
    public readonly type?: string,
  ) {}

  static fromRaw(data: Raw): Deposit {
    return new Deposit(
      arrString(data, 'transaction_date'),
      arrString(data, 'fund_date'),
      arrString(data, 'transaction_info_id'),
      arrString(data, 'transaction_id'),
      arrString(data, 'transaction_detail_account'),
      arrString(data, 'authorization_amount'),
      arrString(data, 'net_amount'),
      arrString(data, 'sweep_id'),
      arrString(data, 'type'),
    )
  }
}
