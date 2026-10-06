import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A release of held funds to the merchant's bank account.
 *
 * `status` is `released`, `failed` (declined, nothing moved — see
 * `failureReason`) or `unknown` (no confirmation came back; it may have gone
 * through, and its amount is held back from `releasable` until reconciled).
 * `transactionInfoIds` is empty for a release requested by amount.
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
    )
  }
}
