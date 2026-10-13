import { ApiException } from './api-exception.js'

/**
 * A capture the API refused, with the reason as a machine-readable code.
 *
 * `errorCode` is one of `not_found`, `already_captured`, `voided`, `refunded`,
 * `authorization_declined`, `not_an_authorization`,
 * `amount_exceeds_authorization` or `processor_declined`; an unfamiliar code
 * from a newer API is passed through as given. Several codes share one
 * message ("Transaction is not an open authorization."), so branch on the
 * code, not the message.
 *
 * `reason` is set on `processor_declined` only: the explanation given when the
 * capture was refused. An expired authorization arrives this way too, since an
 * issuer drops an uncaptured hold without notice.
 *
 * Nothing was captured. Field validation still throws `ValidationException`.
 */
export class CaptureException extends ApiException {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly reason?: string,
    statusCode?: number,
    responseBody: Record<string, unknown> = {},
    cause?: unknown,
  ) {
    super(message, statusCode, responseBody, cause)
  }
}
