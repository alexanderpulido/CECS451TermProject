import { useState } from 'react'
import { buildForecastPayload } from '../lib/payload'

export default function ScenarioSolver({ courseId }: { courseId: number }) {
  const [target, setTarget] = useState('90')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runSolver = async () => {
    setLoading(true)
    try {
      const payload = await buildForecastPayload(courseId)
      const body = {
        target: Number(target),
        weights: payload.weights,
        completed: payload.completed,
        remaining: payload.remaining
      }

      const res = await fetch('http://localhost:8000/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      setResult(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ border: '1px solid #333', padding: 12, borderRadius: 4 }}>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontWeight: 600 }}>Target Grade (%):</label>
        <input
          type="number"
          value={target}
          min={0}
          max={100}
          onChange={e => setTarget(e.target.value)}
          style={{ width: 80 }}
        />
        <button onClick={runSolver} disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          {/* All work completed or already achieved */}
          {result.feasible && result.needed && Object.keys(result.needed).length === 0 && (
            <p>
              <strong>{result.note}</strong>
            </p>
          )}

          {/* Feasible and needs some score */}
          {result.feasible && result.needed && Object.keys(result.needed).length > 0 && (
            <>
              <p>
                <strong>{result.note}</strong>
              </p>
              <ul>
                {Object.entries(result.needed).map(([cat, neededVal]) => (
                  <li key={cat}>
                    <strong>{cat}:</strong> need approximately{' '}
                    {Number(neededVal as number).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </>
          )}

          
          {!result.feasible && (
            <p style={{ color: '#ff6b6b', fontWeight: 600 }}>
              It is not mathematically possible to reach {target}%.
              <br />
              This would require more than 100% on the remaining work.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
