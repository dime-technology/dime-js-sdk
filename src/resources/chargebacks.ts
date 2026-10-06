import { Chargeback } from '../data-objects/chargeback.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * Chargebacks raised against a merchant. Needs the `chargeback:read` ability.
 *
 * The data arrives in a once-daily file from the processor, so it reflects the
 * latest import rather than live dispute activity. Pair it with the
 * `chargeback_opened` / `chargeback_updated` / `chargeback_resolved` webhooks
 * and use these endpoints to reconcile or backfill.
 */
export class Chargebacks extends AbstractResource {
  /**
   * List a merchant's chargebacks.
   *
   * @param filters `start_date` and `end_date` (UTC, `Y-m-d H:i:s`, sent
   *   together), `representment_status` (free text from the processor, e.g.
   *   `New` or `Resolved`)
   */
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Chargeback>> {
    return this.paginate(
      'GET',
      'chargeback/list',
      this.envelope({ sid }, filters),
      Chargeback.fromRaw,
    )
  }

  async show(sid: string, transactionInfoId: string): Promise<Chargeback> {
    const raw = await this.transport.request(
      'GET',
      'chargeback/show',
      this.envelope({ sid, transaction_info_id: transactionInfoId }),
    )
    return Chargeback.fromRaw((raw['data'] as Raw) ?? {})
  }
}
