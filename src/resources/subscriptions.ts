import { Subscription } from '../data-objects/subscription.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/** Customers' subscriptions to subscription plans. */
export class Subscriptions extends AbstractResource {
  /**
   * List a merchant's subscriptions, newest first.
   *
   * @param filters `status` — Active | Failed | Paused | Cancelled | Ended;
   *   `customer_uuid`
   */
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Subscription>> {
    return this.paginate(
      'GET',
      'subscription/list',
      this.envelope({ sid }, filters),
      Subscription.fromRaw,
    )
  }

  async show(sid: string, subscriptionId: number | string): Promise<Subscription> {
    const raw = await this.transport.request(
      'GET',
      'subscription/show',
      this.envelope({ sid, subscription_id: subscriptionId }),
    )
    return Subscription.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Pause a subscription until `pauseUntilDate` (Y-m-d, in the future), or
   * indefinitely when it is omitted.
   */
  async pause(
    sid: string,
    subscriptionId: number | string,
    pauseUntilDate?: string,
  ): Promise<Subscription> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription/pause',
      this.envelope({
        sid,
        subscription_id: subscriptionId,
        pause_until_date: pauseUntilDate,
      }),
    )
    return Subscription.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Reactivate a paused subscription and recompute its next charge date. */
  async resume(sid: string, subscriptionId: number | string): Promise<Subscription> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription/resume',
      this.envelope({ sid, subscription_id: subscriptionId }),
    )
    return Subscription.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Cancel a subscription permanently; no further charges are made. */
  async cancel(sid: string, subscriptionId: number | string): Promise<Subscription> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription/cancel',
      this.envelope({ sid, subscription_id: subscriptionId }),
    )
    return Subscription.fromRaw((raw['data'] as Raw) ?? {})
  }
}
