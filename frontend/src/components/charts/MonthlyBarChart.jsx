import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
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
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: p.fill }} />
          <Typography variant="caption">
            {p.name}: ${p.value.toFixed(2)}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

const MonthlyBarChart = ({ expenses, incomes }) => {
  const data = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').startOf('month'))
    }

    return months.map((m) => {
      const label = m.format('MMM YY')
      const inMonth = (item) => dayjs(item.date).format('YYYY-MM') === m.format('YYYY-MM')

      const income = incomes.filter(inMonth).reduce((s, i) => s + i.amount, 0)
      const expense = expenses.filter(inMonth).reduce((s, e) => s + e.amount, 0)

      return { label, Income: income, Expenses: expense }
    })
  }, [expenses, incomes])

  const isEmpty = data.every((d) => d.Income === 0 && d.Expenses === 0)

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Last 6 months
      </Typography>

      {isEmpty ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
          <Typography variant="body2" color="text.secondary">
            No data for the last 6 months
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <Typography component="span" variant="caption">{value}</Typography>
              )}
            />
            <Bar dataKey="Income" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#c62828" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  )
}

export default MonthlyBarChart
