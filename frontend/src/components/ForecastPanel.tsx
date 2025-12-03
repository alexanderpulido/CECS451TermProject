import { useState } from 'react'
import { buildForecastPayload } from '../lib/payload'
import ForecastChart from './ForecastChart'

type ForecastResult = {
  mean: number
  p10: number
  p90: number
  std: number
}

export default function ForecastPanel({ courseId }: { courseId: number }) {
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    try {
      setLoading(true)
      setError(null)
      const payload = await buildForecastPayload(courseId)
      const res = await fetch('http://localhost:8000/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError('Could not run forecast. Is the backend server running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ border: '1px solid #333', padding: 12, borderRadius: 4, marginBottom: 16 }}>


      <button onClick={run} disabled={loading}>
        {loading ? 'Running…' : 'Run Forecast'}
      </button>

      {error && (
        <div style={{ marginTop: 8, color: '#ff6b6b', fontSize: 13 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 14 }}>
            <strong>Expected Grade (Mean):</strong> {result.mean.toFixed(1)}%
            <br />
            <strong>Likely Range (P10–P90):</strong>{' '}
            {result.p10.toFixed(1)}% – {result.p90.toFixed(1)}%
          </div>
          <p style={{ marginTop: 4, fontStyle: 'italic', color: '#aaaaaa', fontSize: 13 }}>
            This range means the model expects your final grade to fall inside this interval
            about 80% of the time, given your current performance.
          </p>

          <ForecastChart mean={result.mean} p10={result.p10} p90={result.p90} />
        </div>
      )}
    </section>
  )
}
