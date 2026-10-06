import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class DocumentUploadFailure {
  constructor(
    public readonly fileName?: string,
    public readonly reason?: string,
  ) {}

  static fromRaw(data: Raw): DocumentUploadFailure {
    return new DocumentUploadFailure(arrString(data, 'file_name'), arrString(data, 'reason'))
  }
}
