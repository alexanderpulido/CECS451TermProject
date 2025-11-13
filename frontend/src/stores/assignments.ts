import { create } from 'zustand'
import { db, type Assignment } from '../lib/db'

type State = {
  list: Assignment[]
  load: (courseId: number) => Promise<void>
  add: (a: Omit<Assignment,'id'>) => Promise<number>
  remove: (id: number, courseId: number) => Promise<void>
}

export const useAssignments = create<State>((set) => ({
  list: [],
  load: async (courseId) =>
    set({ list: await db.assignments.where('courseId').equals(courseId).toArray() }),

  add: async (a) => {
    const id = await db.assignments.add(a)
    set({ list: await db.assignments.where('courseId').equals(a.courseId).toArray() })
    return id
  },

  remove: async (id, courseId) => {
    await db.assignments.delete(id)
    set({ list: await db.assignments.where('courseId').equals(courseId).toArray() })
  }
}))
