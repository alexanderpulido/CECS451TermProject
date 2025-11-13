import { useEffect, useMemo, useState } from 'react'
import { useCategories } from '../stores/categories'
import { useAssignments } from '../stores/assignments'
import { db } from '../lib/db'

export default function CourseDetail({ courseId }: { courseId: number }) {
  // stores
  const { list: cats, load: loadCats, add: addCat, remove: removeCat } = useCategories()
  const { list: asg, load: loadAsg, add: addAsg, remove: removeAsg } = useAssignments()

  // tiny local form state
  const [catName, setCatName] = useState('')
  const [catWeight, setCatWeight] = useState<number | ''>('')
  const [aTitle, setATitle] = useState('')
  const [aScore, setAScore] = useState<string>('') // string so empty = remaining
  const [aMax, setAMax] = useState<string>('')
  const [aCatId, setACatId] = useState<string>('')

  // load data on mount & when course changes
  useEffect(() => {
    loadCats(courseId)
    loadAsg(courseId)
  }, [courseId, loadCats, loadAsg])

  const totalWeight = useMemo(
    () => cats.reduce((s, c) => s + Number(c.weight || 0), 0),
    [cats]
  )

  const addCategory = async () => {
    if (!catName || catWeight === '') return
    await addCat({ courseId, name: catName.trim(), weight: Number(catWeight) })
    setCatName(''); setCatWeight('')
  }

  const addAssignment = async () => {
    const categoryId = Number(aCatId)
    if (!aTitle || !aMax || !categoryId) return
    await addAsg({
      courseId,
      categoryId,
      title: aTitle.trim(),
      score: aScore === '' ? undefined : Number(aScore),
      max: Number(aMax),
    })
    setATitle(''); setAScore(''); setAMax(''); setACatId('')
  }

  // helper: get category name for assignment row
  const catNameById = (id?: number) => cats.find(c => c.id === id)?.name ?? `cat #${id}`

  // nuke everything in this course
  const clearCourseData = async () => {
    await db.assignments.where('courseId').equals(courseId).delete()
    await db.categories.where('courseId').equals(courseId).delete()
    await loadAsg(courseId)
    await loadCats(courseId)
  }

  return (
    <div style={{ border:'1px solid #444', padding:12, marginTop:16 }}>
      <h3>Course Detail</h3>
      <div>Categories total weight: <b>{totalWeight.toFixed(2)}</b> (aim for 1.0)</div>

      {/* Add Category */}
      <h4 style={{ marginTop:12 }}>Add Category</h4>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input
          placeholder="Name (e.g., Homework)"
          value={catName}
          onChange={e=>setCatName(e.target.value)}
          style={{ minWidth:220 }}
        />
        <input
          placeholder="Weight (0.2)"
          type="number" step="0.01"
          value={catWeight}
          onChange={e=>setCatWeight(e.target.value === '' ? '' : Number(e.target.value))}
          style={{ width:100 }}
        />
        <button onClick={addCategory}>Add</button>
        <button onClick={clearCourseData} style={{ marginLeft:'auto' }}>Clear Course Data</button>
      </div>

      {/* Categories list with Delete */}
      <ul style={{ marginTop:8 }}>
        {cats.map(c => (
          <li key={c.id}>
            {c.name}: {c.weight}{' '}
            <button
              onClick={async ()=>{
                if (!c.id) return
                await removeCat(c.id, courseId)
                await loadAsg(courseId) // refresh assignment list since we delete those too
              }}
              title="Delete category (also deletes assignments in this category)"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Add Assignment */}
      <h4 style={{ marginTop:12 }}>Add Assignment</h4>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <input
          placeholder="Title"
          value={aTitle}
          onChange={e=>setATitle(e.target.value)}
          style={{ minWidth:200 }}
        />
        <input
          placeholder="Score (blank = remaining)"
          type="number"
          value={aScore}
          onChange={e=>setAScore(e.target.value)}
          style={{ width:160 }}
        />
        <input
          placeholder="Max"
          type="number"
          value={aMax}
          onChange={e=>setAMax(e.target.value)}
          style={{ width:120 }}
        />
        <select value={aCatId} onChange={e=>setACatId(e.target.value)} style={{ minWidth:160 }}>
          <option value="">Category</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={addAssignment}>Add</button>
      </div>

      {/* Assignments list with Delete */}
      <ul style={{ marginTop:8 }}>
        {asg.map(a => (
          <li key={a.id}>
            {a.title} — {a.score ?? '–'}/{a.max} ({catNameById(a.categoryId)}){' '}
            <button onClick={() => a.id && removeAsg(a.id, courseId)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
