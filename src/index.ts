import { createApp } from './app'

const DEFAULT_PORT = 3000
const port = Number(process.env.PORT) || DEFAULT_PORT

createApp().listen(port, () => {
  console.log(`acme-ehr-api listening on port ${port}`)
})