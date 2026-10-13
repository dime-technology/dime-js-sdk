import { CaptureResult } from '../data-objects/capture-result.js'
import { MessageResult } from '../data-objects/message-result.js'
import { TokenizeResult } from '../data-objects/tokenize-result.js'
import { Transaction } from '../data-objects/transaction.js'
import { ApiException } from '../exceptions/api-exception.js'
import { CaptureException } from '../exceptions/capture-exception.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { newIdempotencyKey } from '../support/idempotency-key.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export interface IdempotencyOptions {
  /**
   * Sent as the `Idempotency-Key` header. Omit it and the SDK generates one
   * per call, which keeps its own automatic retries from charging twice. Pass
   * your own, and reuse it, to make your retries of the same call safe too.
   */
  idempotencyKey?: string
}

/**
 * Charges, authorizations, captures, refunds and voids send an
 * `Idempotency-Key`. The key is fixed for the call, so every automatic retry of
 * a timeout or 5xx resends it and the API replays the first result instead of
 * reaching the processor again.
 */
export class Transactions extends AbstractResource {
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Transaction>> {
    return this.paginate(
      'GET',
      'transactions',
      this.envelope({ sid }, filters),
      Transaction.fromRaw,
    )
  }

  async show(sid: string, identifier: Raw): Promise<Transaction> {
    const raw = await this.transport.request(
      'GET',
      'transaction',
      this.envelope({ sid, ...identifier }),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  async chargeCard(
    sid: string,
    attributes: Raw,
    options: IdempotencyOptions = {},
  ): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-card',
      this.envelope({ sid, ...attributes }),
      {},
      this.idempotencyHeaders(options),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** @deprecated The API marks this deprecated; prefer chargeCard() with a token. */
  async chargeCardToken(
    sid: string,
    attributes: Raw,
    options: IdempotencyOptions = {},
  ): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-card-token',
      this.envelope({ sid, ...attributes }),
      {},
      this.idempotencyHeaders(options),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  async chargeAch(
    sid: string,
    attributes: Raw,
    options: IdempotencyOptions = {},
  ): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-ach',
      this.envelope({ sid, ...attributes }),
      {},
      this.idempotencyHeaders(options),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  async tokenizeCard(sid: string, attributes: Raw): Promise<TokenizeResult> {
    const raw = await this.transport.request(
      'POST',
      'transaction/tokenize-card',
      this.envelope({ sid, ...attributes }),
    )
    return TokenizeResult.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Place a hold on a card without moving money. Pass a `token` or the raw
   * card fields, as for {@link Transactions.chargeCard}.
   *
   * The returned `transactionNumber` is the handle on the authorization:
   * collect it with {@link Transactions.capture}, or release the hold with
   * {@link Transactions.void} (type `CC`). Capture promptly — the issuer
   * releases an uncaptured hold on its own schedule.
   */
  async authorize(
    sid: string,
    attributes: Raw,
    options: IdempotencyOptions = {},
  ): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/authorize',
      this.envelope({ sid, ...attributes }),
      {},
      this.idempotencyHeaders(options),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Capture an authorization. Omit `amount` to capture the full authorized
   * amount, or pass less to capture part of it.
   *
   * An authorization is captured once: a partial capture settles that amount
   * and releases the rest to the cardholder.
   *
   * Resolves to what was captured. A refused capture throws a
   * {@link CaptureException} whose `errorCode` says why (`already_captured`,
   * `voided`, `processor_declined`, ...).
   *
   * @param transactionId the `transactionNumber` returned by {@link Transactions.authorize}
   */
  async capture(
    sid: string,
    transactionId: number | string,
    amount?: number | string,
    options: IdempotencyOptions = {},
  ): Promise<CaptureResult> {
    let raw: Raw
    try {
      raw = await this.transport.request(
        'POST',
        'transaction/capture',
        this.envelope({ sid, transaction_id: transactionId, amount }),
        {},
        this.idempotencyHeaders(options),
      )
    } catch (error) {
      throw captureException(error) ?? error
    }
    return CaptureResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  async refund(
    sid: string,
    attributes: Raw,
    options: IdempotencyOptions = {},
  ): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'transaction/refund',
      this.envelope({ sid, ...attributes }),
      {},
      this.idempotencyHeaders(options),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  async void(
    sid: string,
    transactionType: string,
    transactionId: number | string,
    options: IdempotencyOptions = {},
  ): Promise<MessageResult> {
    const raw = await this.transport.request(
      'PATCH',
      'transaction/void',
      this.envelope({ sid, transaction_type: transactionType, transaction_id: transactionId }),
      {},
      this.idempotencyHeaders(options),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  private idempotencyHeaders(options: IdempotencyOptions): Record<string, string> {
    return { 'Idempotency-Key': options.idempotencyKey ?? newIdempotencyKey() }
  }
}

/**
 * A refused capture carries `data.code` beside its message; anything without
 * one (an older API, an idempotency refusal) stays the exception it was.
 */
function captureException(error: unknown): CaptureException | undefined {
  if (!(error instanceof ApiException) || error.statusCode !== 400) return undefined

  const data = error.responseBody['data']
  if (typeof data !== 'object' || data === null) return undefined

  const { code, reason } = data as Raw
  if (typeof code !== 'string') return undefined

  return new CaptureException(
    error.message,
    code,
    typeof reason === 'string' ? reason : undefined,
    error.statusCode,
    error.responseBody,
    error,
  )
}
