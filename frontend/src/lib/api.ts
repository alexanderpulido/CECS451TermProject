export async function forecast(payload: any) {
  const res = await fetch('http://localhost:8000/api/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('forecast failed')
  return res.json()
}
