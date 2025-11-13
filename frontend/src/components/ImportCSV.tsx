import { useEffect, useMemo, useState } from 'react'
import { parse, type ParseResult } from 'papaparse'
import { db } from '../lib/db'
import { useAssignments } from '../stores/assignments'

type Row = { Title?: string; Score?: string; Max?: string; Category?: string }

export default function ImportCSV({ courseId }: { courseId: number }) {
  const { load: loadAsg } = useAssignments()
  const [rows, setRows] = useState<Row[]>([])
  const [cats, setCats] = useState<{ id: number; name: string }[]>([])
  const [catMap, setCatMap] = useState<Record<number, number>>({})
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    (async () => {
      const list = await db.categories.where('courseId').equals(courseId).toArray()
      setCats(list.map(c => ({ id: c.id!, name: c.name })))
    })()
  }, [courseId])

  const handleFile = (file: File) => {
    parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        const cleaned = res.data.filter((r: Row) => r.Title)
        setRows(cleaned)
        const next: Record<number, number> = {}
        cleaned.forEach((r: Row, i: number) => {
          const found = cats.find(c => c.name.toLowerCase() === (r.Category || '').toLowerCase())
          if (found) next[i] = found.id
        })
        setCatMap(next)
      }
    })
  }

  const canSave = useMemo(
    () => rows.length > 0 && rows.every((_, i) => catMap[i] !== undefined),
    [rows, catMap]
  )

  const save = async () => {
    setStatus('Saving...')
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
    await loadAsg(courseId)     // refreshes assignments store so the UI updates
    setStatus('Saved!')
  }

  return (
    <div style={{ border:'1px solid #ddd', padding:12, marginTop:16 }}>
      <h3>Import Grades (CSV)</h3>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0])} />
      {rows.length > 0 && (
        <>
          <div style={{ marginTop:8 }}>Preview ({rows.length} rows). Map categories below:</div>
          <table style={{ width:'100%', marginTop:8, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>Title</th>
                <th>Score</th><th>Max</th>
                <th style={{ textAlign:'left' }}>Category</th>
                <th style={{ textAlign:'left' }}>Map To</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.Title}</td>
                  <td style={{ textAlign:'center' }}>{r.Score ?? '—'}</td>
                  <td style={{ textAlign:'center' }}>{r.Max}</td>
                  <td>{r.Category ?? '—'}</td>
                  <td>
                    <select
                      value={catMap[i] ?? ''}
                      onChange={e => setCatMap({ ...catMap, [i]: Number(e.target.value) })}
                    >
                      <option value="">Select…</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button disabled={!canSave} style={{ marginTop:12 }} onClick={save}>Save to Course</button>
          <span style={{ marginLeft:8 }}>{status}</span>
        </>
      )}
    </div>
  )
}
