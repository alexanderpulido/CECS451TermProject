import { useEffect } from 'react'
import { useCourses } from './stores/courses'
import SyllabusParser from './components/SyllabusParser'
import ImportCSV from './components/ImportCSV'
import CourseDetail from './components/CourseDetail'
import ForecastPanel from './components/ForecastPanel'


export default function App() {
  const { courses, load, addCourse, existsByName } = useCourses()
  useEffect(() => { load() }, [load])

  const addSample = async () => {
    if (!(await existsByName('CECS 451'))) {
      await addCourse({ name: 'CECS 451', target: 90 })
      await load()
    }
  }

  const selected = courses[0] // TODO: add real selection UI

  return (
    <div style={{ padding: 16 }}>
      <h1>AI Grade Predictor & Planner</h1>
      <button onClick={addSample}>Add Sample Course</button>

      <h3 style={{ marginTop: 16 }}>Courses</h3>
      <ul>{courses.map(c => <li key={c.id}>{c.name} (Target {c.target ?? '-' }%)</li>)}</ul>

      {selected && (
        <>
          <SyllabusParser courseId={selected.id!} />
          <ImportCSV courseId={selected.id!} />
          <CourseDetail courseId={selected.id!} />
          <ForecastPanel courseId={selected.id!} />
        </>
      )}

    </div>
  )
}
