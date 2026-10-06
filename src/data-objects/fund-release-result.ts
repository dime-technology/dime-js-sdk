import { arrBool, arrObjectFrom, arrString } from '../support/arr.js'
import { FundRelease } from './fund-release.js'

type Raw = Record<string, unknown>

/**
 * The response to a release request. `replayed` is true when the idempotency
 * key had been used before and the original release is being returned rather
 * than a new one sent.
 */
export class FundReleaseResult {
  constructor(
    public readonly sid?: string,
    public readonly replayed: boolean = false,
    public readonly release: FundRelease = new FundRelease(),
  ) {}

  static fromRaw(data: Raw): FundReleaseResult {
    return new FundReleaseResult(
      arrString(data, 'sid'),
      arrBool(data, 'replayed'),
      FundRelease.fromRaw(arrObjectFrom(data, ['release'])),
    )
  }
}
