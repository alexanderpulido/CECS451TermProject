import { useEffect, useState } from 'react'
import { db } from '../lib/db'

type Props = { courseId: number }

type ParsedCategory = {
  name: string
  weight: number
}

export default function SyllabusParser({ courseId }: Props) {
  const [text, setText] = useState('')
  const [cats, setCats] = useState<ParsedCategory[]>([])
  const [status, setStatus] = useState<string>('')

  // Load existing categories on mount
  useEffect(() => {
    ;(async () => {
      const existing = await db.categories.where('courseId').equals(courseId).toArray()
      if (existing.length > 0) {
        setCats(existing.map(c => ({ name: c.name, weight: c.weight })))
      }
    })()
  }, [courseId])

  const parseSyllabus = () => {
    setStatus('')
    const lines = text.split('\n')
    const parsed: ParsedCategory[] = []

    const regex = /([A-Za-z ]+)\s+(\d+)\s*%/ // e.g. "Homework 20%"

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      const m = line.match(regex)
      if (!m) continue
      const name = m[1].trim()
      const pct = Number(m[2])
      if (!isNaN(pct)) {
        parsed.push({ name, weight: pct / 100 })
      }
    }

    if (parsed.length === 0) {
      setStatus('No grading categories found. Try lines like "Homework 20%".')
    } else {
      setCats(parsed)
      setStatus(`Found ${parsed.length} categories.`)
    }
  }

  const totalWeight = cats.reduce((sum, c) => sum + c.weight, 0)
  const weightOk = Math.abs(totalWeight - 1) < 0.01

  const saveCategories = async () => {
    await db.categories.where('courseId').equals(courseId).delete()
    for (const cat of cats) {
      await db.categories.add({ courseId, name: cat.name, weight: cat.weight })
    }
    setStatus('Syllabus categories saved.')
  }

  return (
    <section style={{ border: '1px solid #333', padding: 12, borderRadius: 4, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Step 1 – Paste Syllabus &amp; Extract Categories</h3>
      <p style={{ marginTop: 0, color: '#bbbbbb', fontSize: 13 }}>
        Paste the grading policy text from your syllabus. The parser looks for lines such as:
        <code style={{ marginLeft: 4 }}>Homework 20%</code>, <code>Midterm 30%</code>, <code>Final 50%</code>.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        style={{ width: '100%', background: '#202225', color: '#f5f5f5', border: '1px solid #444' }}
        placeholder="Homework 20%
Midterm 30%
Final 50%"
      />

      <div style={{ marginTop: 8 }}>
        <button onClick={parseSyllabus}>Extract Categories</button>
        <span style={{ marginLeft: 12, fontSize: 13 }}>
          {cats.length > 0 && (
            <>
              Found {cats.length} categories • Sum = {totalWeight.toFixed(2)}{' '}
              {weightOk ? <span style={{ color: '#6fcf97' }}>✓</span> : <span style={{ color: '#e0a800' }}>adjust to 1.0</span>}
            </>
          )}
        </span>
      </div>

      {cats.length > 0 && (
        <ul style={{ marginTop: 8 }}>
          {cats.map((c, idx) => (
            <li key={idx}>
              {c.name}: {c.weight.toFixed(2)}{' '}
              <span style={{ fontSize: 12, color: '#bbbbbb' }}>
                (fraction; {(c.weight * 100).toFixed(0)}% = {c.weight.toFixed(2)})
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 4 }}>
        <button onClick={saveCategories} disabled={cats.length === 0}>
          Save Categories
        </button>
        <span style={{ marginLeft: 8, fontSize: 13 }}>{status}</span>
      </div>
    </section>
  )
}
