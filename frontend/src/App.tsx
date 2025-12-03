import { useEffect, useState } from 'react'
import { useCourses } from './stores/courses'
import SyllabusParser from './components/SyllabusParser'
import ImportCSV from './components/ImportCSV'
import CourseDetail from './components/CourseDetail'
import ForecastPanel from './components/ForecastPanel'
import ScenarioSolver from './components/ScenarioSolver'
import './App.css'

export default function App() {
  const { courses, load, addCourse, renameCourse } = useCourses()
  const [initialized, setInitialized] = useState(false)
  const [localName, setLocalName] = useState('')

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
        const c = state.courses[0]
        if (c) setLocalName(c.name)
      }
    })()
  }, [initialized, load, addCourse])

  const selected = courses[0]

  
  useEffect(() => {
    if (selected) {
      setLocalName(selected.name)
    }
  }, [selected])

  return (
    <div className="app-background">
      <header className="site-header">
        <div className="site-header-inner">
          <h1 className="site-title">AI Grade Predictor & Planner</h1>
          <p className="site-subtitle">
            Paste your syllabus, import grades, and estimate your final course outcome with an AI-assisted model.
          </p>
        </div>
      </header>

      <main className="container">
        {selected && (
          <section className="course-bar">
            <div className="course-bar-main">
              <div className="course-bar-label">Course</div>
              <div className="course-bar-name">{selected.name}</div>
              <div className="course-bar-target">
                Target: <span>{selected.target ?? 90}%</span>
              </div>
            </div>

            <div className="course-bar-edit">
              <input
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder="e.g., CECS 451"
              />
              <button onClick={() => renameCourse(selected.id!, localName)}>
                Update
              </button>
            </div>
          </section>
        )}

        {selected && (
          <section className="steps-timeline">
            {/* Step 1 */}
            <div className="step-row left">
              <article className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <div className="step-label">Step 1</div>
                  <h2 className="step-title">Paste Syllabus &amp; Extract Categories</h2>
                  <p className="step-description">
                    Paste the grading policy from your syllabus. The app parses categories
                    like Homework, Midterm, and Final and converts them into weights.
                  </p>
                  <div className="step-body">
                    <SyllabusParser courseId={selected.id!} />
                  </div>
                </div>
              </article>
            </div>

            {/* Step 2 */}
            <div className="step-row right">
              <article className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <div className="step-label">Step 2</div>
                  <h2 className="step-title">Import Grades (CSV)</h2>
                  <p className="step-description">
                    Upload a CSV export from Canvas or your LMS and map each row to the
                    syllabus categories you just created.
                  </p>
                  <div className="step-body">
                    <ImportCSV courseId={selected.id!} />
                  </div>
                </div>
              </article>
            </div>

            {/* Step 3 */}
            <div className="step-row left">
              <article className="step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <div className="step-label">Step 3</div>
                  <h2 className="step-title">Review &amp; Edit Course Detail</h2>
                  <p className="step-description">
                    Fine-tune your grading categories and assignments. Add missing items
                    or tweak weights to match your actual syllabus.
                  </p>
                  <div className="step-body">
                    <CourseDetail courseId={selected.id!} />
                  </div>
                </div>
              </article>
            </div>

            {/* Step 4 */}
            <div className="step-row right">
              <article className="step-card">
                <div className="step-number">4</div>
                <div className="step-content">
                  <div className="step-label">Step 4</div>
                  <h2 className="step-title">Forecast Final Grade</h2>
                  <p className="step-description">
                    Run the forecast model to estimate your expected final grade and see
                    a likely range based on your current performance.
                  </p>
                  <div className="step-body">
                    <ForecastPanel courseId={selected.id!} />
                  </div>
                </div>
              </article>
            </div>

            {/* Step 5 */}
            <div className="step-row left">
              <article className="step-card">
                <div className="step-number">5</div>
                <div className="step-content">
                  <div className="step-label">Step 5</div>
                  <h2 className="step-title">Scenario Solver (What Do I Need?)</h2>
                  <p className="step-description">
                    Set a target final grade and see what average you&apos;ll need on the
                    remaining work in each category to reach it.
                  </p>
                  <div className="step-body">
                    <ScenarioSolver courseId={selected.id!} />
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
