import { arrBool, arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A held-funds merchant's balance at the processor, in dollars.
 *
 * `releasable` is the figure that matters, and the one a release is checked
 * against: `available` less `atRisk`, `owedToSplit`, `unresolved` and
 * `releaseFee`, never below zero and never above `achOutLimitRemaining`.
 *
 * Monetary values are kept as strings to avoid float rounding.
 */
export class HeldBalance {
  constructor(
    public readonly sid?: string,
    public readonly available?: string,
    public readonly pending?: string,
    public readonly reserve?: string,
    public readonly atRisk?: string,
    public readonly owedToSplit?: string,
    public readonly unresolved?: string,
    public readonly releaseFee?: string,
    public readonly releasable?: string,
    public readonly achSettlementDays?: number,
    public readonly achOutEnabled: boolean = false,
    public readonly achOutLimitRemaining?: string,
  ) {}

  static fromRaw(data: Raw): HeldBalance {
    return new HeldBalance(
      arrString(data, 'sid'),
      arrString(data, 'available'),
      arrString(data, 'pending'),
      arrString(data, 'reserve'),
      arrString(data, 'at_risk'),
      arrString(data, 'owed_to_split'),
      arrString(data, 'unresolved'),
      arrString(data, 'release_fee'),
      arrString(data, 'releasable'),
      arrInt(data, 'ach_settlement_days'),
      arrBool(data, 'ach_out_enabled'),
      arrString(data, 'ach_out_limit_remaining'),
    )
  }
}
