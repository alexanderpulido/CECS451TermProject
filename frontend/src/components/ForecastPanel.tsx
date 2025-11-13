import { useState } from 'react'
import { forecast } from '../lib/api'
import { buildForecastPayload } from '../lib/payload'

export default function ForecastPanel({ courseId }: { courseId: number }) {
  const [result, setResult] = useState<any>(null)

  const run = async () => {
    const payload = await buildForecastPayload(courseId)
    console.log('forecast payload →', payload)   // verify weights/completed/remaining
    const data = await forecast(payload)
    setResult(data)
  }

  return (
    <div style={{ marginTop: 24, border: '1px solid #ddd', padding: 12 }}>
      <button onClick={run}>Run Forecast</button>{' '}
      {result && (
        <>Mean: {result.mean.toFixed(1)} | P10: {result.p10.toFixed(1)} | P90: {result.p90.toFixed(1)}</>
      )}
    </div>
  )
}
