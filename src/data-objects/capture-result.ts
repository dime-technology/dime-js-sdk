import { arrString } from '../support/arr.js'
import { MessageResult } from './message-result.js'

type Raw = Record<string, unknown>

/**
 * The response to a capture: what was taken, beside the confirmation message.
 *
 * `transactionId` is the authorization's transaction number, as sent.
 * `authorizedAmount` is what the hold was for and `capturedAmount` what was
 * collected; a partial capture releases the difference. Amounts are the API's
 * two-decimal strings (e.g. `"95.00"`). `status` is `captured` and
 * `capturedAt` is an ISO 8601 timestamp.
 *
 * It extends {@link MessageResult}, so `message` still reads as before. The
 * extra fields are undefined against an API that predates them.
 */
export class CaptureResult extends MessageResult {
  constructor(
    message?: string,
    public readonly transactionId?: string,
    public readonly authorizedAmount?: string,
    public readonly capturedAmount?: string,
    public readonly status?: string,
    public readonly capturedAt?: string,
  ) {
    super(message)
  }

  static override fromRaw(data: Raw): CaptureResult {
    return new CaptureResult(
      arrString(data, 'message'),
      arrString(data, 'transaction_id'),
      arrString(data, 'authorized_amount'),
      arrString(data, 'captured_amount'),
      arrString(data, 'status'),
      arrString(data, 'captured_at'),
    )
  }
}
