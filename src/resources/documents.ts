import { DocumentUploadResult } from '../data-objects/document-upload-result.js'
import { MerchantDocument } from '../data-objects/merchant-document.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * A file to upload: a `Blob` or `File`, or raw bytes (a Node `Buffer` from
 * `fs.readFile`, say) with a file name. A bare `Blob` without a name is sent
 * as `document`. The server identifies the type from the content, so
 * `contentType` is optional.
 */
export type DocumentFile =
  | Blob
  | { content: Blob | ArrayBuffer | Uint8Array; filename: string; contentType?: string }

/**
 * Documents held for a merchant: underwriting paperwork, identity
 * verification, and evidence contesting a chargeback.
 */
export class Documents extends AbstractResource {
  /**
   * Upload up to 10 documents for a merchant (PDF, JPG, PNG, DOC, DOCX or RTF,
   * each 9 MB or smaller). Sent as `multipart/form-data`.
   *
   * Files are stored independently: check `failed` on the result and re-send
   * only those. A 413 means the request as a whole was too large — send fewer
   * files per request.
   *
   * Uploading does not forward the document to the processor; our team
   * reviews it and does that.
   *
   * @param docType `Verification`, `FraudHolds`, `Underwriting` or
   *   `RetrievalRequest` (evidence for a chargeback or retrieval request)
   * @param chargebackTransactionInfoId attach the files as evidence to this
   *   chargeback (its `transactionInfoId`)
   */
  async upload(
    sid: string,
    docType: string,
    files: DocumentFile[],
    chargebackTransactionInfoId?: string,
  ): Promise<DocumentUploadResult> {
    const raw = await this.transport.requestMultipart(
      'POST',
      'document/upload',
      this.envelope({
        sid,
        doc_type: docType,
        chargeback_transaction_info_id: chargebackTransactionInfoId,
      }),
      files.map((file) => ({ field: 'files[]', ...toBlob(file) })),
    )
    return DocumentUploadResult.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * List the documents held for a merchant, whether uploaded through the API,
   * by our team, or through the merchant application.
   *
   * @param filters `doc_type`, `chargeback_transaction_info_id`
   */
  async list(sid: string, filters: Raw = {}): Promise<MerchantDocument[]> {
    const raw = await this.transport.request(
      'GET',
      'document/list',
      this.envelope({ sid }, filters),
    )
    const documents = Array.isArray(raw['data']) ? (raw['data'] as Raw[]) : []
    return documents.map(MerchantDocument.fromRaw)
  }
}

function toBlob(file: DocumentFile): { content: Blob; filename: string } {
  if (file instanceof Blob) {
    const name = (file as Blob & { name?: unknown }).name
    return { content: file, filename: typeof name === 'string' && name !== '' ? name : 'document' }
  }

  // Cast because TypeScript's BlobPart narrows typed arrays to ArrayBuffer-backed
  // ones, which a Node Buffer (typed over ArrayBufferLike) does not satisfy.
  const content =
    file.content instanceof Blob
      ? file.content
      : new Blob([file.content as BlobPart], file.contentType ? { type: file.contentType } : {})

  return { content, filename: file.filename }
}
