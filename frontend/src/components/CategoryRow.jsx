import { Box, Typography, Avatar } from '@mui/material'

const CategoryRow = ({ name, color, amount, type }) => {
  const initial = name ? name[0].toUpperCase() : '?'
  const displayColor = color || '#9e9e9e'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        '&:hover': { bgcolor: 'grey.50' },
      }}
    >
      <Avatar sx={{ bgcolor: displayColor, width: 40, height: 40, fontSize: 16, fontWeight: 700 }}>
        {initial}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={500} noWrap>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {type}
        </Typography>
      </Box>
      <Typography
        variant="body1"
        fontWeight={600}
        sx={{ color: type === 'income' ? 'success.main' : 'error.main' }}
      >
        {type === 'income' ? '+' : '-'}${amount.toFixed(2)}
      </Typography>
    </Box>
  )
}

export default CategoryRow
