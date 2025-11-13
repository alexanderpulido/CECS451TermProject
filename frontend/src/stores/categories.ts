import { create } from 'zustand'
import { db, type Category } from '../lib/db'

type State = {
  list: Category[]
  load: (courseId: number) => Promise<void>
  add: (c: Omit<Category,'id'>) => Promise<number>
  remove: (id: number, courseId: number) => Promise<void>
}

export const useCategories = create<State>((set) => ({
  list: [],
  load: async (courseId) =>
    set({ list: await db.categories.where('courseId').equals(courseId).toArray() }),

  add: async (c) => {
    const id = await db.categories.add(c)
    set({ list: await db.categories.where('courseId').equals(c.courseId).toArray() })
    return id
  },

  remove: async (id, courseId) => {
    await db.categories.delete(id)
    // (optional) also delete assignments for this category:
    await db.assignments.where('categoryId').equals(id).delete()
    set({ list: await db.categories.where('courseId').equals(courseId).toArray() })
  }
}))
