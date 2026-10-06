import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A document held for a merchant. Named `MerchantDocument` rather than
 * `Document` so it does not shadow the DOM's global `Document` type.
 *
 * The upload response carries only `uuid`, `fileName`, `docType` and `size`;
 * the list response fills in the rest. `sentToProcessorAt` and
 * `processorResponse` stay undefined until our team forwards the document.
 */
export class MerchantDocument {
  constructor(
    public readonly uuid?: string,
    public readonly fileName?: string,
    public readonly docType?: string,
    public readonly chargebackTransactionInfoId?: string,
    public readonly size?: number,
    public readonly uploadedAt?: string,
    public readonly uploadedVia?: string,
    public readonly sentToProcessorAt?: string,
    public readonly processorResponse?: string,
  ) {}

  static fromRaw(data: Raw): MerchantDocument {
    // `sent_to_processor` is null, or a [when, processor response] pair.
    const sent = Array.isArray(data['sent_to_processor'])
      ? (data['sent_to_processor'] as unknown[])
      : []
    const [sentAt, processorResponse] = sent.map((value) =>
      value === null || value === undefined ? undefined : String(value),
    )

    return new MerchantDocument(
      arrString(data, 'uuid'),
      arrString(data, 'file_name'),
      arrString(data, 'doc_type'),
      arrString(data, 'chargeback_transaction_info_id'),
      arrInt(data, 'size'),
      arrString(data, 'uploaded_at'),
      arrString(data, 'uploaded_via'),
      sentAt,
      processorResponse,
    )
  }
}
