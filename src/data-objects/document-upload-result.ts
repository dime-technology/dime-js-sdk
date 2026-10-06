import { arrArrayFrom, arrString } from '../support/arr.js'
import { DocumentUploadFailure } from './document-upload-failure.js'
import { MerchantDocument } from './merchant-document.js'

type Raw = Record<string, unknown>

/**
 * The outcome of a document upload. Files are stored independently, so a
 * request can partly succeed: `documents` lists what was stored and `failed`
 * what was not, so only the failures need re-sending.
 */
export class DocumentUploadResult {
  constructor(
    public readonly message?: string,
    public readonly documents: MerchantDocument[] = [],
    public readonly failed: DocumentUploadFailure[] = [],
  ) {}

  static fromRaw(data: Raw): DocumentUploadResult {
    return new DocumentUploadResult(
      arrString(data, 'message'),
      arrArrayFrom(data, 'documents').map(MerchantDocument.fromRaw),
      arrArrayFrom(data, 'failed').map(DocumentUploadFailure.fromRaw),
    )
  }
}
