import { Card, CardContent, Typography, Box } from '@mui/material'

const SummaryCard = ({ label, amount, color, icon }) => {
  return (
    <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: color || 'text.secondary', display: 'flex' }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: color || 'text.primary' }}
          noWrap
        >
          ${amount.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default SummaryCard
