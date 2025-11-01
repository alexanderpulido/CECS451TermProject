import { useEffect, useMemo, useState } from 'react'
import { useCategories } from '../stores/categories'
import { useAssignments } from '../stores/assignments'

export default function CourseDetail({ courseId }: { courseId: number }) {
  const { list: cats, load: loadCats, add: addCat } = useCategories()
  const { list: asg, load: loadAsg, add: addAsg } = useAssignments()
  const [form, setForm] = useState({ catName: '', catWeight: 0, title: '', score: '', max: '', catId: '' })

  useEffect(() => { loadCats(courseId); loadAsg(courseId) }, [courseId, loadCats, loadAsg])

  const totalWeight = useMemo(() => cats.reduce((s, c) => s + Number(c.weight || 0), 0), [cats])

  return (
    <div style={{ border:'1px solid #333', padding:12, marginTop:16 }}>
      <h3>Course Detail</h3>
      <div>Categories total weight: <b>{totalWeight}</b> (aim for 1.0)</div>

      <h4 style={{ marginTop:12 }}>Add Category</h4>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder="Name (e.g., Homework)" value={form.catName}
               onChange={e=>setForm(f=>({ ...f, catName:e.target.value }))} />
        <input placeholder="Weight (0.2)" type="number" step="0.01" value={form.catWeight}
               onChange={e=>setForm(f=>({ ...f, catWeight:Number(e.target.value) }))} />
        <button onClick={async ()=>{
          if(!form.catName) return
          await addCat({ courseId, name: form.catName, weight: Number(form.catWeight) })
          setForm(f=>({ ...f, catName:'', catWeight:0 }))
          loadCats(courseId)
        }}>Add</button>
      </div>

      <ul style={{ marginTop:8 }}>
        {cats.map(c => <li key={c.id}>{c.name}: {c.weight}</li>)}
      </ul>

      <h4 style={{ marginTop:12 }}>Add Assignment</h4>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <input placeholder="Title" value={form.title}
               onChange={e=>setForm(f=>({ ...f, title:e.target.value }))} />
        <input placeholder="Score" type="number" value={form.score}
               onChange={e=>setForm(f=>({ ...f, score:e.target.value }))} />
        <input placeholder="Max" type="number" value={form.max}
               onChange={e=>setForm(f=>({ ...f, max:e.target.value }))} />
        <select value={form.catId} onChange={e=>setForm(f=>({ ...f, catId:e.target.value }))}>
          <option value="">Category</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={async ()=>{
          const categoryId = Number(form.catId)
          if(!categoryId || !form.title || !form.max) return
          await addAsg({ courseId, categoryId, title: form.title, score: form.score ? Number(form.score) : undefined, max: Number(form.max) })
          setForm(f=>({ ...f, title:'', score:'', max:'', catId:'' }))
          loadAsg(courseId)
        }}>Add</button>
      </div>

      <ul style={{ marginTop:8 }}>
        {asg.map(a => <li key={a.id}>{a.title} — {a.score ?? '–'}/{a.max} (cat #{a.categoryId})</li>)}
      </ul>
    </div>
  )
}
