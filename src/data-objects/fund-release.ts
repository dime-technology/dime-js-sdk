import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A release of held funds to the merchant's bank account.
 *
 * `status` is `released`, `failed` (declined, nothing moved — see
 * `failureReason`) or `unknown` (no confirmation came back; it may have gone
 * through, and its amount is held back from `releasable` until reconciled).
 * `transactionInfoIds` is empty for a release requested by amount.
 *
 * `returned` is what a `released` release becomes days later when the
 * merchant's own bank rejects the transfer and the money comes back.
 * `completedAt` still says when it was sent; `returnedAt` says when the bank
 * rejected it, `returnCode` gives the bank's reason (R02 account closed, R03 no
 * account, R04 invalid account number), and `returnFee` what the return cost.
 * `fee` keeps what the transfer was quoted at. `returnFee` can be undefined on
 * a returned release until the return fee has been reported.
 */
export class FundRelease {
  constructor(
    public readonly id?: number,
    public readonly amount?: string,
    public readonly fee?: string,
    public readonly status?: string,
    public readonly statusLabel?: string,
    public readonly idempotencyKey?: string,
    public readonly transactionInfoIds: string[] = [],
    public readonly failureReason?: string,
    public readonly requestedAt?: string,
    public readonly completedAt?: string,
    public readonly returnedAt?: string,
    public readonly returnCode?: string,
    public readonly returnFee?: string,
  ) {}

  static fromRaw(data: Raw): FundRelease {
    const ids = Array.isArray(data['transaction_info_ids'])
      ? (data['transaction_info_ids'] as unknown[]).map(String)
      : []

    return new FundRelease(
      arrInt(data, 'id'),
      arrString(data, 'amount'),
      arrString(data, 'fee'),
      arrString(data, 'status'),
      arrString(data, 'status_label'),
      arrString(data, 'idempotency_key'),
      ids,
      arrString(data, 'failure_reason'),
      arrString(data, 'requested_at'),
      arrString(data, 'completed_at'),
      arrString(data, 'returned_at'),
      arrString(data, 'return_code'),
      arrString(data, 'return_fee'),
    )
  }
}
