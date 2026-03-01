import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Box, Typography, useTheme } from '@mui/material'

const UNCATEGORIZED_COLOR = '#9e9e9e'

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null
  const { name, value, color } = payload[0].payload
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.5,
        py: 1,
        boxShadow: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="body2" fontWeight={600}>{name}</Typography>
      </Box>
      <Typography variant="body2">${value.toFixed(2)}</Typography>
      <Typography variant="caption" color="text.secondary">{pct}% of total</Typography>
    </Box>
  )
}

const ExpensePieChart = ({ expenses }) => {
  const theme = useTheme()

  const { data, total } = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      const key = e.category?.id ?? '__none__'
      const label = e.category?.name ?? 'Uncategorized'
      const color = e.category?.color ?? UNCATEGORIZED_COLOR
      if (!map[key]) map[key] = { name: label, value: 0, color }
      map[key].value += e.amount
    }
    const data = Object.values(map).sort((a, b) => b.value - a.value)
    const total = data.reduce((s, d) => s + d.value, 0)
    return { data, total }
  }, [expenses])

  const isEmpty = data.length === 0

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Expenses by category
      </Typography>

      {isEmpty ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
          <Typography variant="body2" color="text.secondary">
            No expense data this month
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke={theme.palette.background.paper} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <Typography component="span" variant="caption">
                  {value}
                </Typography>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Box>
  )
}

export default ExpensePieChart
