import { Transport } from '../http/transport.js'
import { CursorPage, type PageFetcher } from '../pagination/cursor-page.js'

type Raw = Record<string, unknown>

export abstract class AbstractResource {
  constructor(protected readonly transport: Transport) {}

  /**
   * Build the standard Dime request envelope, dropping null/undefined values.
   */
  protected envelope(data: Raw = {}, filters: Raw = {}): Raw {
    const body: Raw = {}

    const prunedData = pruneNulls(data)
    if (Object.keys(prunedData).length > 0) body['data'] = prunedData

    const prunedFilters = pruneNulls(filters)
    if (Object.keys(prunedFilters).length > 0) body['filters'] = prunedFilters

    return body
  }

  protected async paginate<T>(
    method: string,
    path: string,
    body: Raw,
    map: (item: Raw) => T,
    query: Record<string, string> = {},
  ): Promise<CursorPage<T>> {
    const raw = await this.transport.request(method, path, body, query)

    const items = Array.isArray(raw['data']) ? (raw['data'] as Raw[]) : []
    const meta =
      raw['meta'] !== null && typeof raw['meta'] === 'object' && !Array.isArray(raw['meta'])
        ? (raw['meta'] as Raw)
        : {}

    const nextCursor = extractCursor(meta, 'next_cursor')
    const prevCursor = extractCursor(meta, 'prev_cursor')

    const fetcher: PageFetcher<T> = (cursor) => this.paginate(method, path, body, map, { cursor })

    return new CursorPage<T>(
      items.map(map),
      nextCursor,
      prevCursor,
      typeof meta['per_page'] === 'number' ? (meta['per_page'] as number) : undefined,
      typeof meta['path'] === 'string' ? (meta['path'] as string) : undefined,
      nextCursor !== undefined ? fetcher : undefined,
    )
  }
}

function extractCursor(meta: Raw, key: string): string | undefined {
  const v = meta[key]
  return typeof v === 'string' && v !== '' ? v : undefined
}

function pruneNulls(obj: Raw): Raw {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined))
}
