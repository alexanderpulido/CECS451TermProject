import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function ForecastChart({
  mean,
  p10,
  p90
}: {
  mean: number
  p10: number
  p90: number
}) {
  const data = [
    { name: 'P10', value: p10 },
    { name: 'Mean', value: mean },
    { name: 'P90', value: p90 }
  ]

  return (
    <div style={{ width: '100%', height: 260, marginTop: 8 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
