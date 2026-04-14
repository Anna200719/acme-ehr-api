# Acme EHR API

A FHIR data processing pipeline and REST API for the Acme EHR MVP. Supports bulk import, field extraction, data transformation, flexible querying, and anomaly detection.

## Stack

- **Node.js + TypeScript** — primary stack, matches production experience
- **Express 5** — HTTP framework
- **better-sqlite3** — synchronous SQLite driver; no Docker dependency for the database, data persists across restarts
- **multer** — multipart file upload handling for `POST /import`
- **tsx + nodemon** — TypeScript execution in dev without a separate compile step
- **Jest + ts-jest + supertest** — unit and integration tests

## Requirements

- Node.js 20+
- npm 9+

## Setup

```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000` (override with `PORT` env variable).

To use a custom database path:
```bash
DB_PATH=./custom.db npm run dev
```

## Testing

```bash
npm test
```

Unit tests cover `field-extractor` and `stats` utilities. Integration tests cover `POST /import` and `GET /records`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build |
| `npm run lint` | Type-check without emitting |
| `npm test` | Run all tests |

## API

### POST /import

Upload and process a JSONL file. Accepts multipart file upload or raw `text/plain` body.

```bash
# Raw body
curl -X POST http://localhost:3000/import \
  -H "Content-Type: text/plain" \
  --data-binary @resources/sample-data.jsonl

# File upload
curl -X POST http://localhost:3000/import \
  -F "file=@resources/sample-data.jsonl"
```

Response:
```json
{
  "total": 72,
  "imported": 68,
  "errors": [
    { "line": 9, "id": "obs-007", "field": "status", "message": "Missing required field: status" }
  ],
  "warnings": [
    { "line": 1, "id": "obs-001", "field": "valueQuantity", "message": "Missing expected field: valueQuantity" }
  ],
  "stats": {
    "byResourceType": { "Observation": 41, "Condition": 8, "MedicationRequest": 7, "Procedure": 5, "Patient": 7 },
    "uniquePatients": 7
  }
}
```

### GET /records

List records with optional filtering and field projection.

```bash
# All records
curl http://localhost:3000/records

# Filter by resource type
curl "http://localhost:3000/records?resourceType=Observation"

# Filter by patient
curl "http://localhost:3000/records?subject=Patient/PT-001"

# Field projection
curl "http://localhost:3000/records?resourceType=Observation&fields=id,subject,valueQuantity"
```

### GET /records/:id

```bash
curl http://localhost:3000/records/obs-001

# With field projection
curl "http://localhost:3000/records/obs-001?fields=id,status,valueQuantity"
```

### POST /transform

Transform records without storing. Supports `extract` (rename a nested field) and `flatten` (expand an object into prefixed keys).

```bash
curl -X POST http://localhost:3000/transform \
  -H "Content-Type: application/json" \
  -d '{
    "resourceTypes": ["Observation"],
    "transformations": [
      { "action": "extract", "field": "valueQuantity.value", "as": "value" },
      { "action": "extract", "field": "valueQuantity.unit", "as": "unit" },
      { "action": "flatten", "field": "code.coding[0]" }
    ],
    "filters": { "subject": "Patient/PT-001" }
  }'
```

### GET /analytics

Data quality statistics and anomaly detection.

```bash
curl http://localhost:3000/analytics
```

Response includes:
- Record counts by resource type
- Unique patient count
- Import session summary with error counts
- Detected anomalies with method and reason
- High-risk patients (multiple anomalies)

## Configuration

### Extraction config (`src/config/extraction.ts`)

Defines which fields are extracted from which resource types. Uses `'all'` for universal fields or a `ResourceType[]` array for type-specific fields.

```typescript
export const extractionConfig = {
  id: 'all',
  resourceType: 'all',
  subject: ['Observation', 'Procedure', 'Condition', 'MedicationRequest'],
  effectiveDateTime: ['Observation'],
  // ...
}
```

In production this would live in a config store (etcd, AWS Parameter Store) per client.

### Validation config (`src/config/validation.ts`)

Hardcoded required fields and valid status values per resource type. `expectedFields` drives data quality warnings — only business-significant missing fields are reported, not every extraction field.

> **Note on warnings:** warnings are emitted only for missing fields that are meaningful for analytics (e.g. `valueQuantity` on an Observation, `dosageInstruction` on a MedicationRequest). In production, a `qualityRules` config would separate `required`, `expected`, and `optional` fields per resource type.

### Anomaly config (`src/config/anomaly.ts`)

LOINC code mapping and clinical reference ranges used as fallback thresholds.

## Anomaly Detection

The additional feature is a **hybrid anomaly detection** system on `GET /analytics`.

**Approach:**

- If a patient has 3+ data points for a given metric → **z-score** (dynamic, patient-specific baseline)
- If fewer data points → **reference-range fallback** (static clinical thresholds)

This mirrors the approach used in production monitoring systems (e.g. New Relic dynamic baselines) where static thresholds produce too many false positives. The key insight is that "high" is relative to the individual patient's history, not a universal cutoff.

```
z-score = |value - mean(history)| / stdDev(history)
anomaly if z-score > 2
```

**Current limitation:** with only 50 records, most patients have fewer than 3 data points per metric, so the reference-range fallback is used for most detections. In production with longitudinal data, z-score would be the primary method.

**High-risk patients** are flagged when they have 2+ anomalies across metrics simultaneously (configurable via `ANOMALY_CONFIG.MIN_ANOMALIES_FOR_HIGH_RISK`).

## Architecture

```
Request → Route → Controller → Service → DB
```

- **controllers/** — HTTP in/out only, no business logic
- **services/** — business logic, orchestration
- **config/** — extraction rules, validation rules, anomaly thresholds (data, not code)
- **lib/** — pure utility functions (field extraction, stats, anomaly detection)
- **models/** — TypeScript interfaces for FHIR resources and DB rows
- **db/** — SQLite connection and schema initialization

Records are stored with both raw FHIR JSON and extracted fields, so queries can use either without re-parsing.

## Production notes

Things intentionally omitted for scope, with notes on how they'd be handled:

- **Auth** — JWT with RBAC; PHI access would require audit logging
- **Batch insert** — already uses a SQLite transaction; at scale, chunked inserts with a message queue (SQS/Kafka)
- **Config store** — extraction and validation config would live in etcd or AWS Parameter Store per client/tenant
- **Anomaly baselines** — full z-score with rolling window over patient history; current hybrid is a pragmatic fallback for small datasets
- **Schema migrations** — versioned SQL migrations (e.g. via `db-migrate` or `flyway`)

## AI Usage

Claude (Anthropic) was used for architecture discussions, code review, and debugging. I wrote and validated all implementation decisions myself and can explain every part of the code.
