import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import categoriesService from '../services/categoriesService'

const COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b',
  '#43a047', '#fb8c00', '#6d4c41', '#757575',
]

const defaultForm = { name: '', type: 'expense', color: '#1e88e5' }

const AddCategoryDialog = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setForm(defaultForm)
      setError('')
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to create category')
    },
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  const handleClose = () => {
    setForm(defaultForm)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Category</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            fullWidth
            autoFocus
            helperText="Letters, numbers, spaces, underscores only"
          />
          <TextField
            select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="income">Income</MenuItem>
          </TextField>
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
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Add'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default AddCategoryDialog
