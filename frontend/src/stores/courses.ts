import { create } from 'zustand'
import { db, type Course } from '../lib/db'

type State = {
  courses: Course[]
  load: () => Promise<void>
  addCourse: (c: Omit<Course,'id'>) => Promise<number>
  existsByName: (name: string) => Promise<boolean>
}

export const useCourses = create<State>((set) => ({
  courses: [],

  load: async () => {
    const courses = await db.courses.toArray()
    set({ courses })
  },

  addCourse: async (c) => {
    const id = await db.courses.add(c)
    const courses = await db.courses.toArray()
    set({ courses })
    return id
  },

  existsByName: async (name) => {
    const found = await db.courses.where('name').equals(name).first()
    return !!found
  }
}))
