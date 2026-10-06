import { arrArrayFrom, arrBool, arrString } from '../support/arr.js'
import { ReleasableTransaction } from './releasable-transaction.js'

type Raw = Record<string, unknown>

/**
 * The payments releasable right now, newest first and capped at 500 —
 * `truncated` says whether there were more.
 */
export class ReleasableTransactions {
  constructor(
    public readonly sid?: string,
    public readonly transactions: ReleasableTransaction[] = [],
    public readonly total?: string,
    public readonly truncated: boolean = false,
  ) {}

  static fromRaw(data: Raw): ReleasableTransactions {
    return new ReleasableTransactions(
      arrString(data, 'sid'),
      arrArrayFrom(data, 'transactions').map(ReleasableTransaction.fromRaw),
      arrString(data, 'total'),
      arrBool(data, 'truncated'),
    )
  }
}
