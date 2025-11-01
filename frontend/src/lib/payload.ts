import { db } from './db'

// Builds { weights, completed, remaining } from Dexie rows
export async function buildForecastPayload(courseId: number) {
  const cats = await db.categories.where('courseId').equals(courseId).toArray()
  const asg = await db.assignments.where('courseId').equals(courseId).toArray()

  const weights: Record<string, number> = {}
  const completed: Record<string, number[]> = {}
  const remaining: Record<string, number> = {}

  for (const c of cats) {
    weights[c.name] = Number(c.weight)
    completed[c.name] = []
    remaining[c.name] = 0
  }

  for (const a of asg) {
    const cat = cats.find(c => c.id === a.categoryId)
    if (!cat) continue
    if (a.score == null || a.max == null) {
      remaining[cat.name] += 1
    } else {
      completed[cat.name].push((a.score / a.max) * 100.0)
    }
  }

  // simple priors (optional)
  const priors: Record<string, {mu:number, sigma:number}> = {}
  for (const c of cats) {
    priors[c.name] = { mu: 85, sigma: 7 } // tweak later or learn from history
  }

  return { weights, completed, remaining, priors }
}
