import { arrBool, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * Where a merchant sits in onboarding.
 *
 * `status` is the headline: `lead`, `discovery`, `proposal`,
 * `application_in_progress`, `underwriting`, `live`, `cancellation_pending`,
 * `churned` or `declined`, or undefined for a merchant that has not started.
 * `applicationStatus` is the application record's own state — `draft`,
 * `pending_review`, `submitted`, `approved`, `needs_documents` or `failed` —
 * and is the field to read while `status` is `underwriting`, since only
 * `needs_documents` asks anything of the merchant.
 *
 * `boarded` is the ground truth for "can they take money": a merchant can be
 * `live` without the application ever reading `approved`.
 */
export class ApplicationStatus {
  constructor(
    public readonly sid?: string,
    public readonly name?: string,
    public readonly status?: string,
    public readonly applicationStatus?: string,
    public readonly boarded: boolean = false,
    public readonly applicationSubmittedAt?: string,
  ) {}

  static fromRaw(data: Raw): ApplicationStatus {
    return new ApplicationStatus(
      arrString(data, 'sid'),
      arrString(data, 'name'),
      arrString(data, 'status'),
      arrString(data, 'application_status'),
      arrBool(data, 'boarded'),
      arrString(data, 'application_submitted_at'),
    )
  }
}
