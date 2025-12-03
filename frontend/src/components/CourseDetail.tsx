import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import type { Category, Assignment } from '../lib/db'

export default function CourseDetail({ courseId }: { courseId: number }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatWeight, setNewCatWeight] = useState('0.1')
  const [newTitle, setNewTitle] = useState('')
  const [newScore, setNewScore] = useState('')
  const [newMax, setNewMax] = useState('')
  const [newCatId, setNewCatId] = useState<number | ''>('')

  const loadData = async () => {
    const cats = await db.categories.where('courseId').equals(courseId).toArray()
    const asgn = await db.assignments.where('courseId').equals(courseId).toArray()
    setCategories(cats)
    setAssignments(asgn)
  }

  useEffect(() => {
    loadData()
  }, [courseId])

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0)

  const addCategory = async () => {
    if (!newCatName.trim()) return
    const weight = Number(newCatWeight)
    await db.categories.add({ courseId, name: newCatName.trim(), weight })
    setNewCatName('')
    setNewCatWeight('0.1')
    await loadData()
  }

  const deleteCategory = async (id: number) => {
    await db.categories.delete(id)
    await db.assignments.where('categoryId').equals(id).delete()
    await loadData()
  }

  const addAssignment = async () => {
    if (!newTitle.trim() || !newMax || !newCatId) return
    await db.assignments.add({
      courseId,
      categoryId: newCatId as number,
      title: newTitle.trim(),
      score: newScore ? Number(newScore) : undefined,
      max: Number(newMax)
    })
    setNewTitle('')
    setNewScore('')
    setNewMax('')
    setNewCatId('')
    await loadData()
  }

  const deleteAssignment = async (id: number) => {
    await db.assignments.delete(id)
    await loadData()
  }

  const clearCourseData = async () => {
    await db.categories.where('courseId').equals(courseId).delete()
    await db.assignments.where('courseId').equals(courseId).delete()
    await loadData()
  }

  return (
    <section style={{ border: '1px solid #333', padding: 12, borderRadius: 4, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          
          <span style={{ fontSize: 13 }}>
            Categories total weight: {totalWeight.toFixed(2)} (aim for 1.0)
          </span>
        </div>
        <button onClick={clearCourseData}>Clear Course Data</button>
      </div>

      {/* Add Category */}
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 4 }}>Add Category</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Name (e.g., Homework)"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            style={{ flex: '0 0 220px' }}
          />
          <input
            placeholder="Weight (0.2)"
            value={newCatWeight}
            onChange={e => setNewCatWeight(e.target.value)}
            style={{ width: 80 }}
          />
          <button onClick={addCategory}>Add</button>
        </div>

        {categories.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {categories.map(c => (
              <li key={c.id}>
                {c.name}: {c.weight.toFixed(2)}{' '}
                <button style={{ marginLeft: 8 }} onClick={() => deleteCategory(c.id!)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Assignment */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 4 }}>Add Assignment</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ flex: '1 0 180px' }}
          />
          <input
            placeholder="Score (blank = remaining)"
            value={newScore}
            onChange={e => setNewScore(e.target.value)}
            style={{ width: 150 }}
          />
          <input
            placeholder="Max"
            value={newMax}
            onChange={e => setNewMax(e.target.value)}
            style={{ width: 80 }}
          />
          <select
            value={newCatId}
            onChange={e => setNewCatId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={addAssignment}>Add</button>
        </div>

        {assignments.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {assignments.map(a => {
              const catName = categories.find(c => c.id === a.categoryId)?.name ?? '—'
              const labelScore =
                a.score === undefined ? '—/ ' + a.max : `${a.score}/${a.max}`
              return (
                <li key={a.id}>
                  {a.title} — {labelScore} ({catName})
                  <button style={{ marginLeft: 8 }} onClick={() => deleteAssignment(a.id!)}>
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
