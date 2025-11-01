import Dexie, { type Table } from 'dexie'

export interface Course { id?: number; name: string; instructor?: string; target?: number }
export interface Category { id?: number; courseId: number; name: string; weight: number }
export interface Assignment { id?: number; courseId: number; categoryId: number; title: string; score?: number; max: number }

class GradeDB extends Dexie {
  courses!: Table<Course, number>
  categories!: Table<Category, number>
  assignments!: Table<Assignment, number>

  constructor() {
    super('grade_planner_db')

    // v1 (old): non-unique courses
    this.version(1).stores({
      courses: '++id, name',
      categories: '++id, courseId, name',
      assignments: '++id, courseId, categoryId'
    })

    // v2: make course name unique with &name
    this.version(2).stores({
      courses: '++id,&name',
      categories: '++id, courseId, name',
      assignments: '++id, courseId, categoryId'
    }).upgrade(() => {
      // nothing to migrate; just enforce uniqueness going forward
    })
  }
}
export const db = new GradeDB()
