import request from 'supertest'
import { createApp } from '../../src/app'
import fs from 'fs'
import path from 'path'

const app = createApp()

const sampleData = fs.readFileSync(
  path.join(__dirname, '../../resources/sample-data.jsonl'),
  'utf-8'
)

describe('POST /import', () => {
  it('imports valid JSONL and returns summary', async () => {
    const res = await request(app)
      .post('/import')
      .set('Content-Type', 'text/plain')
      .send(sampleData)

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(72)
    expect(res.body.imported).toBe(68)
    expect(res.body.errors).toHaveLength(5)
    expect(res.body.stats.uniquePatients).toBe(7)
  })

  it('returns 400 when no content provided', async () => {
    const res = await request(app)
      .post('/import')
      .set('Content-Type', 'text/plain')
      .send('')

    expect(res.status).toBe(400)
  })
})

describe('GET /records', () => {
  it('filters by resourceType', async () => {
    const res = await request(app)
      .get('/records?resourceType=Observation')

    expect(res.status).toBe(200)
    expect(res.body.every((r: { resourceType: string }) => r.resourceType === 'Observation')).toBe(true)
  })

  it('filters by subject', async () => {
    const res = await request(app)
      .get('/records?subject=Patient/PT-001')

    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(
      res.body.every((r: { subject: { reference: string } }) =>
        r.subject.reference === 'Patient/PT-001'
      )
    ).toBe(true)
  })

  it('returns 404 for unknown record', async () => {
    const res = await request(app).get('/records/non-existent')
    expect(res.status).toBe(404)
  })
})