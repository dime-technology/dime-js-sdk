import { MessageResult } from '../data-objects/message-result.js'
import { SubscribeResult } from '../data-objects/subscribe-result.js'
import { SubscriptionPlan } from '../data-objects/subscription-plan.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * Subscription plans: a recurring bundle of line items customers subscribe to.
 *
 * A plan is created as a `draft`, published to `active` to take subscribers,
 * and archived to stop new ones. Existing subscribers keep the snapshot they
 * subscribed to, so editing or archiving a plan never changes them.
 */
export class SubscriptionPlans extends AbstractResource {
  /**
   * List a merchant's plans, newest first.
   *
   * @param status `draft`, `active` or `archived`
   */
  async list(sid: string, status?: string): Promise<CursorPage<SubscriptionPlan>> {
    return this.paginate(
      'GET',
      'subscription-plan/list',
      this.envelope({ sid, status }),
      SubscriptionPlan.fromRaw,
    )
  }

  async show(sid: string, subscriptionPlanId: number | string): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'GET',
      'subscription-plan/show',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Create a plan as a draft. Publish it before customers can subscribe.
   *
   * @param attributes
   *   `name`, `recurrence_schedule` (`Weekly` | `Biweekly` | `FirstFifteenth` |
   *   `Monthly` | `Yearly`) and `lines` are required. `lines[]` takes
   *   `item_id` (a Merchant item), `name`, `quantity`, `unit_price` and
   *   optional `description`. Optional: `description`, `allow_public` (list
   *   the plan in the public catalog).
   */
  async create(sid: string, attributes: Raw): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'POST',
      'subscription-plan/create',
      this.envelope({ sid, ...attributes }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Replace a plan's fields and line items wholesale — send the full plan, not
   * just what changed. Existing subscribers are unaffected.
   *
   * @param attributes same shape as {@link SubscriptionPlans.create}
   */
  async edit(
    sid: string,
    subscriptionPlanId: number | string,
    attributes: Raw,
  ): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription-plan/edit',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId, ...attributes }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Delete a plan with no subscribers. A plan that has any must be archived instead. */
  async delete(sid: string, subscriptionPlanId: number | string): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'subscription-plan/delete',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  /** Move a draft plan with at least one line item to active, so customers can subscribe. */
  async publish(sid: string, subscriptionPlanId: number | string): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription-plan/publish',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Stop new subscriptions and hide the plan from the public catalog. */
  async archive(sid: string, subscriptionPlanId: number | string): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription-plan/archive',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Move an archived plan back to draft, to review and re-publish.
   * `allowPublic` stays off until the merchant opts back into the catalog.
   */
  async unarchive(sid: string, subscriptionPlanId: number | string): Promise<SubscriptionPlan> {
    const raw = await this.transport.request(
      'PATCH',
      'subscription-plan/unarchive',
      this.envelope({ sid, subscription_plan_id: subscriptionPlanId }),
    )
    return SubscriptionPlan.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Subscribe a customer to an active plan: charges the first payment to one
   * of the customer's saved payment methods and enrolls them.
   */
  async subscribe(
    sid: string,
    subscriptionPlanId: number | string,
    customerUuid: string,
    paymentMethodId: number | string,
  ): Promise<SubscribeResult> {
    const raw = await this.transport.request(
      'POST',
      'subscription-plan/subscribe',
      this.envelope({
        sid,
        subscription_plan_id: subscriptionPlanId,
        customer_uuid: customerUuid,
        payment_method: paymentMethodId,
      }),
    )
    return SubscribeResult.fromRaw((raw['data'] as Raw) ?? {})
  }
}
