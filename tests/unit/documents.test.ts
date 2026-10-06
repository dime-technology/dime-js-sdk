import { describe, expect, it } from 'vitest'
import { fakeClient, sentForm, sentHeaders, sentQuery, sentUrl } from '../helpers.js'

const uploadedBody = {
  data: {
    message: '2 documents uploaded.',
    documents: [
      { uuid: 'uuid-1', file_name: 'receipt.pdf', doc_type: 'RetrievalRequest', size: 20841 },
      { uuid: 'uuid-2', file_name: 'invoice.png', doc_type: 'RetrievalRequest', size: 1024 },
    ],
  },
}

describe('Documents', () => {
  it('upload sends bracketed multipart fields and files[], without a JSON Content-Type', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: uploadedBody }])

    const result = await client.documents.upload(
      '000010',
      'RetrievalRequest',
      [
        { content: new Uint8Array([37, 80, 68, 70]), filename: 'receipt.pdf' },
        new File([new Uint8Array([137, 80, 78, 71])], 'invoice.png', { type: 'image/png' }),
      ],
      '8675309',
    )

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('document/upload')
    // fetch must derive multipart/form-data and its boundary from the body.
    expect(sentHeaders(calls)['Content-Type']).toBeUndefined()

    const form = sentForm(calls)
    expect(form.get('data[sid]')).toBe('000010')
    expect(form.get('data[doc_type]')).toBe('RetrievalRequest')
    expect(form.get('data[chargeback_transaction_info_id]')).toBe('8675309')
    expect(form.has('files')).toBe(false)

    const files = form.getAll('files[]') as File[]
    expect(files.map((file) => file.name)).toEqual(['receipt.pdf', 'invoice.png'])
    expect(files[0]?.size).toBe(4)

    expect(result.message).toBe('2 documents uploaded.')
    expect(result.documents[0]?.uuid).toBe('uuid-1')
    expect(result.documents[0]?.size).toBe(20841)
    expect(result.failed).toEqual([])
  })

  it('upload omits chargeback_transaction_info_id when not given and names a bare Blob', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: uploadedBody }])

    await client.documents.upload('000010', 'Underwriting', [new Blob(['%PDF'])])

    const form = sentForm(calls)
    expect(form.has('data[chargeback_transaction_info_id]')).toBe(false)
    expect((form.get('files[]') as File).name).toBe('document')
  })

  it('upload reports the files that could not be stored', async () => {
    const { client } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            message: '1 document uploaded. 1 could not be stored.',
            documents: [
              { uuid: 'uuid-1', file_name: 'receipt.pdf', doc_type: 'Verification', size: 10 },
            ],
            failed: [
              {
                file_name: 'statement.pdf',
                reason: 'The file could not be stored. Send it again.',
              },
            ],
          },
        },
      },
    ])

    const result = await client.documents.upload('000010', 'Verification', [
      { content: new Blob(['a']), filename: 'receipt.pdf' },
      { content: new Blob(['b']), filename: 'statement.pdf' },
    ])

    expect(result.documents).toHaveLength(1)
    expect(result.failed[0]?.fileName).toBe('statement.pdf')
    expect(result.failed[0]?.reason).toBe('The file could not be stored. Send it again.')
  })

  it('list sends filters as query params and returns a plain array', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: [
            {
              uuid: 'uuid-1',
              file_name: 'receipt.pdf',
              doc_type: 'RetrievalRequest',
              chargeback_transaction_info_id: '8675309',
              size: 20841,
              uploaded_at: '2026-09-18T11:35:01+00:00',
              uploaded_via: 'api',
              sent_to_processor: null,
            },
            {
              uuid: 'uuid-2',
              file_name: 'license.jpg',
              doc_type: 'Verification',
              chargeback_transaction_info_id: null,
              size: 512,
              uploaded_at: '2026-09-17T09:00:00+00:00',
              uploaded_via: null,
              sent_to_processor: ['2026-09-18 12:00:00', 'Success'],
            },
          ],
        },
      },
    ])

    const documents = await client.documents.list('000010', { doc_type: 'RetrievalRequest' })

    expect(sentUrl(calls)).toContain('document/list')
    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'filters[doc_type]': 'RetrievalRequest',
    })
    expect(documents).toHaveLength(2)
    expect(documents[0]?.chargebackTransactionInfoId).toBe('8675309')
    expect(documents[0]?.uploadedVia).toBe('api')
    expect(documents[0]?.sentToProcessorAt).toBeUndefined()
    expect(documents[1]?.sentToProcessorAt).toBe('2026-09-18 12:00:00')
    expect(documents[1]?.processorResponse).toBe('Success')
  })
})
