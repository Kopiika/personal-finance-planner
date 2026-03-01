import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  Chip,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import categoriesService from '../services/categoriesService'

const COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b',
  '#43a047', '#fb8c00', '#6d4c41', '#757575',
]

const EditCategoryDialog = ({ open, onClose, category }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', color: '#1e88e5' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setForm({ name: category.name, color: category.color || '#1e88e5' })
    }
  }, [category])

  const mutation = useMutation({
    mutationFn: (data) => categoriesService.update(category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setError('')
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update category')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Category</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Type:</Typography>
            <Chip
              label={category?.type}
              size="small"
              color={category?.type === 'income' ? 'success' : 'error'}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">(cannot be changed)</Typography>
          </Box>

          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            fullWidth
            autoFocus
            helperText="Letters, numbers, spaces, underscores only"
          />

          <Box>
            <Box sx={{ mb: 1, fontSize: 14, color: 'text.secondary' }}>Color</Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: form.color === c ? '3px solid #000' : '3px solid transparent',
                    transition: 'border 0.15s',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default EditCategoryDialog
