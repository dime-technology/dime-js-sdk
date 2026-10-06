import { MessageResult } from '../data-objects/message-result.js'
import { TokenizeResult } from '../data-objects/tokenize-result.js'
import { Transaction } from '../data-objects/transaction.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

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

  async chargeCard(sid: string, attributes: Raw): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-card',
      this.envelope({ sid, ...attributes }),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** @deprecated The API marks this deprecated; prefer chargeCard() with a token. */
  async chargeCardToken(sid: string, attributes: Raw): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-card-token',
      this.envelope({ sid, ...attributes }),
    )
    return Transaction.fromRaw((raw['data'] as Raw) ?? {})
  }

  async chargeAch(sid: string, attributes: Raw): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/charge-ach',
      this.envelope({ sid, ...attributes }),
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
  async authorize(sid: string, attributes: Raw): Promise<Transaction> {
    const raw = await this.transport.request(
      'POST',
      'transaction/authorize',
      this.envelope({ sid, ...attributes }),
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
   * @param transactionId the `transactionNumber` returned by {@link Transactions.authorize}
   */
  async capture(
    sid: string,
    transactionId: number | string,
    amount?: number | string,
  ): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'transaction/capture',
      this.envelope({ sid, transaction_id: transactionId, amount }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  async refund(sid: string, attributes: Raw): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'transaction/refund',
      this.envelope({ sid, ...attributes }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  async void(
    sid: string,
    transactionType: string,
    transactionId: number | string,
  ): Promise<MessageResult> {
    const raw = await this.transport.request(
      'PATCH',
      'transaction/void',
      this.envelope({ sid, transaction_type: transactionType, transaction_id: transactionId }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }
}
