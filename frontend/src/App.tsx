import { useEffect, useState } from 'react'
import { useCourses } from './stores/courses'
import SyllabusParser from './components/SyllabusParser'
import ImportCSV from './components/ImportCSV'
import CourseDetail from './components/CourseDetail'
import ForecastPanel from './components/ForecastPanel'
import ScenarioSolver from './components/ScenarioSolver'

export default function App() {
  const { courses, load, addCourse, renameCourse } = useCourses()
  const [initialized, setInitialized] = useState(false)

  // Local state for course name (user edits in textbox)
  const [localName, setLocalName] = useState('')

  // Ensure a single course exists
  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    ;(async () => {
      await load()
      const state = useCourses.getState()

      if (state.courses.length === 0) {
        await addCourse({ name: 'My Course', target: 90 })
        await load()
      } else {
        // if a course exists, sync localName with actual name
        const c = state.courses[0]
        if (c) setLocalName(c.name)
      }
    })()
  }, [initialized, load, addCourse])

  const selected = courses[0]

  // Sync localName whenever selected course changes
  useEffect(() => {
    if (selected) {
      setLocalName(selected.name)
    }
  }, [selected])

  return (
    <div style={{ minHeight: '100vh', background: '#101214', color: '#f5f5f5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 32px' }}>

        {/* Header */}
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>AI Grade Predictor & Planner</h1>
          <p style={{ margin: '4px 0 0', color: '#bbbbbb' }}>
            Paste your syllabus, import grades, and estimate your final course outcome with an AI-assisted model.
          </p>
        </header>

        {/* Step Overview */}
        <section
          style={{
            border: '1px solid #333',
            borderRadius: 4,
            padding: 10,
            marginBottom: 16,
            background: '#15171a'
          }}
        >
          <strong>How to use this tool:</strong>
          <ol style={{ margin: '6px 0 0 18px', fontSize: 13, color: '#cccccc' }}>
            <li>Paste your syllabus and extract grading categories (Step 1).</li>
            <li>Import grades from CSV or add assignments manually (Step 2 &amp; 3).</li>
            <li>Run the forecast to see your expected final grade (Step 4).</li>
            <li>Use the scenario solver to see what scores you need to hit a target (Step 5).</li>
          </ol>
        </section>

        {/* Course Name Section */}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Course Name</h3>

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
              {/* Input row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  style={{
                    width: 260,
                    padding: '4px 6px',
                    background: '#202225',
                    color: '#f5f5f5',
                    border: '1px solid #444',
                    borderRadius: 4
                  }}
                  placeholder="e.g., CECS 451"
                />

                <button
                  onClick={() => renameCourse(selected.id!, localName)}
                  style={{
                    padding: '4px 12px',
                    background: '#2d7dd2',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Update Course
                </button>
              </div>

              {/* Display current name */}
              <div style={{ fontSize: 14, color: '#cccccc' }}>
                <strong>Current Course Title:</strong> {selected.name}
              </div>

              {/* Target line */}
              <div style={{ fontSize: 14, color: '#bbbbbb' }}>
                <strong>Target:</strong> {selected.target ?? 90}%
              </div>
            </div>
          )}
        </section>

        <hr style={{ borderColor: '#333', margin: '16px 0' }} />

        {/* Steps 1–5 components */}
        {selected && (
          <>
            <SyllabusParser courseId={selected.id!} />
            <ImportCSV courseId={selected.id!} />
            <CourseDetail courseId={selected.id!} />
            <ForecastPanel courseId={selected.id!} />
            <ScenarioSolver courseId={selected.id!} />
          </>
        )}
      </div>
    </div>
  )
}
