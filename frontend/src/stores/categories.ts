import { create } from 'zustand'
import { db, type Category } from '../lib/db'

type State = {
  list: Category[]
  load: (courseId: number) => Promise<void>
  add: (c: Omit<Category,'id'>) => Promise<number>
}
export const useCategories = create<State>((set) => ({
  list: [],
  load: async (courseId) => set({ list: await db.categories.where('courseId').equals(courseId).toArray() }),
  add: async (c) => {
    const id = await db.categories.add(c)
    set({ list: await db.categories.where('courseId').equals(c.courseId).toArray() })
    return id
  }
}))
