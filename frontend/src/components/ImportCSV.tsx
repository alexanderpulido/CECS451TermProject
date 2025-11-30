import { useMemo, useState } from 'react'
import { parse, type ParseResult } from 'papaparse'
import { db } from '../lib/db'

type Row = { Title?: string; Score?: string; Max?: string; Category?: string }

export default function ImportCSV({ courseId }: { courseId: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const [cats, setCats] = useState<{ id: number; name: string }[]>([])
  const [catMap, setCatMap] = useState<Record<number, number>>({})
  const [status, setStatus] = useState<string>('')

  const handleFile = async (file: File) => {
    setStatus('')

    // 1) Load latest categories from Dexie
    const list = await db.categories.where('courseId').equals(courseId).toArray()
    const currentCats = list.map(c => ({ id: c.id!, name: c.name }))
    setCats(currentCats)

    // 2) Parse CSV
    parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        const cleaned = res.data.filter((r: Row) => r.Title)
        setRows(cleaned)

        // 3) Try to auto-map based on Category text
        const next: Record<number, number> = {}
        cleaned.forEach((r: Row, i: number) => {
          const found = currentCats.find(
            c => c.name.toLowerCase() === (r.Category || '').toLowerCase()
          )
          if (found) next[i] = found.id
        })
        setCatMap(next)
        setStatus(`Loaded ${cleaned.length} rows from CSV.`)
      }
    })
  }

  const canSave = useMemo(
    () => rows.length > 0 && rows.every((_, i) => catMap[i] !== undefined),
    [rows, catMap]
  )

  const save = async () => {
    setStatus('Saving grades into this course...')
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const categoryId = catMap[i]
      if (!categoryId || !r.Title || !r.Max) continue
      await db.assignments.add({
        courseId,
        categoryId,
        title: r.Title,
        score: r.Score ? Number(r.Score) : undefined,
        max: Number(r.Max)
      })
    }
    setStatus('Saved! You can now see these assignments under Course Detail.')
  }

  return (
    <section style={{ border: '1px solid #333', padding: 12, borderRadius: 4, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Step 2 – Import Grades (CSV)</h3>
      <p style={{ marginTop: 0, color: '#bbbbbb', fontSize: 13 }}>
        Upload a CSV export from your LMS (Canvas, etc.). Then map each row to a syllabus category.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={e => e.target.files && handleFile(e.target.files[0])}
      />

      {rows.length > 0 && (
        <>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            Preview ({rows.length} rows). Map each row to a course category:
          </div>
          <table
            style={{
              width: '100%',
              marginTop: 8,
              borderCollapse: 'collapse',
              fontSize: 13
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Title</th>
                <th style={{ borderBottom: '1px solid #444' }}>Score</th>
                <th style={{ borderBottom: '1px solid #444' }}>Max</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Category (from CSV)</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Map To (syllabus)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ paddingTop: 4 }}>{r.Title}</td>
                  <td style={{ textAlign: 'center' }}>{r.Score ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>{r.Max}</td>
                  <td>{r.Category ?? '—'}</td>
                  <td>
                    <select
                      value={catMap[i] ?? ''}
                      onChange={e => setCatMap({ ...catMap, [i]: Number(e.target.value) })}
                    >
                      <option value="">Select…</option>
                      {cats.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={!canSave} style={{ marginTop: 12 }} onClick={save}>
            Save to Course
          </button>
        </>
      )}

      {status && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#bbbbbb' }}>
          {status}
        </div>
      )}
    </section>
  )
}
