import { Deposit } from '../data-objects/deposit.js'
import { DepositGroup } from '../data-objects/deposit-group.js'
import { DepositWithTransactions } from '../data-objects/deposit-with-transactions.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class Deposits extends AbstractResource {
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Deposit>> {
    return this.paginate('GET', 'deposit/list', this.envelope({ sid }, filters), Deposit.fromRaw)
  }

  async listWithTransactions(sid: string, filters: Raw): Promise<DepositGroup> {
    const raw = await this.transport.request('GET', 'deposit/list-with-trans', this.envelope({ sid }, filters))
    return DepositGroup.fromRaw((raw['data'] as Raw) ?? {})
  }

  async show(sid: string, identifier: Raw): Promise<DepositWithTransactions> {
    const raw = await this.transport.request('GET', 'deposit/show', this.envelope({ sid, ...identifier }))
    return DepositWithTransactions.fromRaw((raw['data'] as Raw) ?? {})
  }
}
