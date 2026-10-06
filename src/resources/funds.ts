import { FundReleaseResult } from '../data-objects/fund-release-result.js'
import { HeldBalance } from '../data-objects/held-balance.js'
import { ReleasableTransactions } from '../data-objects/releasable-transactions.js'
import { ApiException } from '../exceptions/index.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * Held funds, for merchants on a tier that does not sweep their balance to
 * their bank automatically. Every other merchant gets a 422 from these
 * endpoints rather than a misleading zero.
 *
 * Reading needs `funds:read`. Releasing needs `funds:release`, a separate
 * ability, and is open to affiliate keys only.
 */
export class Funds extends AbstractResource {
  /** The merchant's balance at the processor, and how much is releasable today. */
  async balance(sid: string): Promise<HeldBalance> {
    const raw = await this.transport.request('GET', 'funds/balance', this.envelope({ sid }))
    return HeldBalance.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** The payments that can be released right now — the list to release by `transaction_info_ids`. */
  async transactions(sid: string): Promise<ReleasableTransactions> {
    const raw = await this.transport.request('GET', 'funds/transactions', this.envelope({ sid }))
    return ReleasableTransactions.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Send part of a merchant's held balance to the bank account on file.
   *
   * Use a fresh `idempotencyKey` per intended release and reuse it when
   * retrying: a retry with the same key and request returns the original
   * release instead of sending the money again. The SDK's own retries of
   * timeouts and 5xx responses resend the same key, so they are safe.
   *
   * Check `release.status`, not only whether this resolved. A declined release
   * (`failed`) is returned rather than thrown, alongside `released` and
   * `unknown`. Refusals that create no release — a transaction that does not
   * qualify, more than is releasable, a key reused for a different request, a
   * release already in flight — throw an {@link ApiException} whose response
   * body carries the detail (`data.ineligible`, `data.releasable`).
   *
   * @param attributes exactly one of `amount` (dollars, at most two decimal
   *   places) or `transaction_info_ids` (up to 100, all or nothing)
   */
  async release(sid: string, idempotencyKey: string, attributes: Raw): Promise<FundReleaseResult> {
    let raw: Raw

    try {
      raw = await this.transport.request(
        'POST',
        'funds/release',
        this.envelope({ sid, idempotency_key: idempotencyKey, ...attributes }),
      )
    } catch (e) {
      const data = e instanceof ApiException ? e.getResponseBody()['data'] : undefined
      if (data !== null && typeof data === 'object' && 'release' in data) {
        return FundReleaseResult.fromRaw(data as Raw)
      }
      throw e
    }

    return FundReleaseResult.fromRaw((raw['data'] as Raw) ?? {})
  }
}
