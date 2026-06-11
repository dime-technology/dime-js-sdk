export type PageFetcher<T> = (cursor: string) => Promise<CursorPage<T>>

export class CursorPage<T> {
  constructor(
    public readonly data: T[],
    public readonly nextCursor?: string,
    public readonly prevCursor?: string,
    public readonly perPage?: number,
    public readonly path?: string,
    private readonly fetcher?: PageFetcher<T>,
  ) {}

  hasMore(): boolean {
    return this.nextCursor !== undefined && this.fetcher !== undefined
  }

  async next(): Promise<CursorPage<T> | null> {
    if (!this.hasMore() || this.nextCursor === undefined || this.fetcher === undefined) {
      return null
    }
    return this.fetcher(this.nextCursor)
  }

  /** Lazily iterate every item across all remaining pages. */
  async *autoPaging(): AsyncGenerator<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let page: CursorPage<T> | null = this
    while (page !== null) {
      for (const item of page.data) {
        yield item
      }
      page = await page.next()
    }
  }

  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]()
  }

  get length(): number {
    return this.data.length
  }
}
