import './env.js'
import { app } from './app.js'
import { flushSync } from './pushback.js'

const PORT = process.env.PORT || 5175

app.listen(PORT, () => {
  console.log(`\n  Stryg.Bytes CMS server running:`)
  console.log(`  • API        http://localhost:${PORT}/api/health`)
  console.log(`  • Admin      http://localhost:${PORT}/admin`)
  console.log(`  • Review     http://localhost:${PORT}/review`)
  console.log(`  • Portfolio  http://localhost:${PORT} (when dist/ built)\n`)
})

let shuttingDown = false
const shutdown = () => {
  if (shuttingDown) return
  shuttingDown = true
  flushSync()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)