import { arrInt, arrObjectFrom, arrString } from '../support/arr.js'
import { Transaction } from './transaction.js'

type Raw = Record<string, unknown>

export class DepositWithTransactions {
  constructor(
    public readonly sid?: string,
    public readonly transactionInfoId?: string,
    public readonly transactionId?: string,
    public readonly transactionDate?: string,
    public readonly fundDate?: string,
    public readonly type?: string,
    public readonly countOfTransactions?: number,
    public readonly transTotal?: string,
    public readonly transactions: Transaction[] = [],
  ) {}

  static fromRaw(data: Raw): DepositWithTransactions {
    const txRaw = data['transactions']
    const transactions = Array.isArray(txRaw)
      ? (txRaw as Raw[]).map((t) => Transaction.fromRaw(t))
      : typeof txRaw === 'object' && txRaw !== null
        ? Object.values(txRaw as Record<string, Raw>).map((t) => Transaction.fromRaw(t))
        : []

    return new DepositWithTransactions(
      arrString(data, 'sid'),
      arrString(data, 'transaction_info_id'),
      arrString(data, 'transaction_id'),
      arrString(data, 'transaction_date'),
      arrString(data, 'fund_date'),
      arrString(data, 'type'),
      arrInt(data, 'countOfTransactions'),
      arrString(data, 'transTotal'),
      transactions,
    )
  }
}
