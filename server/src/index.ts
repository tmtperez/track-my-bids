import { createApp } from './app.js'
import { scheduleFollowUps } from './jobs/followups'   // 👈 import here

const port = Number(process.env.PORT || 4000)
const app = createApp()

// start the cron scheduler
scheduleFollowUps()   // 👈 run it once at startup

app.listen(port, () => {
  console.log(`API listening on :${port}`)
})
