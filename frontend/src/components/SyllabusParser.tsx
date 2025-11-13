import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/db'
import { useCategories } from '../stores/categories'

type Parsed = { name: string; weight: number }

export default function SyllabusParser({ courseId }: { courseId: number }) {
  const { load: loadCats } = useCategories()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<Parsed[]>([])
  const [status, setStatus] = useState('')

  // simple regex for lines like "Homework 20%" / "Midterm – 30 %" / "Final: 50%"
  const parse = () => {
    const lines = text.split(/\n+/)
    const results: Parsed[] = []
    const rx = /([A-Za-z][A-Za-z \-\/&]*)[:\-–]?\s*(\d{1,3})\s*%/g
    for (const ln of lines) {
      let m: RegExpExecArray | null
      while ((m = rx.exec(ln)) !== null) {
        const name = m[1].trim().replace(/\s+/g, ' ')
        const w = Number(m[2]) / 100
        if (name && w > 0 && w <= 1) results.push({ name, weight: w })
      }
    }
    const dedup: Record<string, Parsed> = {}
    results.forEach(r => (dedup[r.name.toLowerCase()] = r))
    setParsed(Object.values(dedup))
  }

  const sum = useMemo(() => parsed.reduce((s, p) => s + p.weight, 0), [parsed])
  const okSum = Math.abs(1 - sum) <= 0.02

  const save = async () => {
    setStatus('Saving...')
    for (const p of parsed) {
      await db.categories.add({ courseId, name: p.name, weight: p.weight })
    }
    await loadCats(courseId)       // refreshes categories store so Course Detail updates
    setStatus('Saved!')
  }

  useEffect(() => { setParsed([]); setText(''); setStatus('') }, [courseId])

  return (
    <div style={{ border:'1px solid #ddd', padding:12, marginTop:16 }}>
      <h3>Parse Syllabus (paste text)</h3>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste the grading policy text from the syllabus here…"
        rows={6}
        style={{ width:'100%' }}
      />
      <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
        <button onClick={parse}>Extract Categories</button>
        {parsed.length > 0 && (
          <>
            <div>Found {parsed.length} categories • Sum = {sum.toFixed(2)} {okSum ? '✅' : '⚠️'}</div>
            {!okSum && <div style={{color:'#b00'}}>Edit weights so total ≈ 1.00</div>}
          </>
        )}
      </div>

      {parsed.length > 0 && (
        <>
          <ul style={{ marginTop:8 }}>
            {parsed.map((p, i) => (
              <li key={i}>
                <input
                  value={p.name}
                  onChange={e => {
                    const next = [...parsed]; next[i] = { ...p, name: e.target.value }; setParsed(next)
                  }}
                /> —{' '}
                <input
                  type="number" step="0.01"
                  value={p.weight}
                  onChange={e => {
                    const next = [...parsed]; next[i] = { ...p, weight: Number(e.target.value) }; setParsed(next)
                  }}
                /> (fraction; 0.20 = 20%)
              </li>
            ))}
          </ul>
          <button onClick={save} disabled={!okSum}>Save Categories</button>
          <span style={{ marginLeft:8 }}>{status}</span>
        </>
      )}
    </div>
  )
}
