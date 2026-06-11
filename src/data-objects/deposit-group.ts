import { arrInt, arrString } from '../support/arr.js'
import { DepositWithTransactions } from './deposit-with-transactions.js'

type Raw = Record<string, unknown>

export class DepositGroup {
  constructor(
    public readonly sid?: string,
    public readonly count?: number,
    public readonly deposits: DepositWithTransactions[] = [],
  ) {}

  static fromRaw(data: Raw): DepositGroup {
    const depositsRaw = data['deposits']
    const deposits =
      typeof depositsRaw === 'object' && depositsRaw !== null && !Array.isArray(depositsRaw)
        ? Object.values(depositsRaw as Record<string, Raw>).map((d) =>
            DepositWithTransactions.fromRaw(d),
          )
        : []

    return new DepositGroup(arrString(data, 'sid'), arrInt(data, 'count'), deposits)
  }
}
