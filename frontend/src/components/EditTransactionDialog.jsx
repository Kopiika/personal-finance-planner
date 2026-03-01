import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
  Chip,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import expensesService from '../services/expensesService'
import incomesService from '../services/incomesService'
import categoriesService from '../services/categoriesService'

const EditTransactionDialog = ({ open, onClose, transaction }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ title: '', amount: '', date: '', category: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (transaction) {
      setForm({
        title: transaction.title,
        amount: transaction.amount,
        date: dayjs(transaction.date).format('YYYY-MM-DD'),
        category: transaction.category?.id || '',
      })
    }
  }, [transaction])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    enabled: open,
  })

  const filteredCategories = categories.filter(
    (c) => c.type === transaction?.type
  )

  const mutation = useMutation({
    mutationFn: (data) => {
      const service = transaction.type === 'expense' ? expensesService : incomesService
      return service.update(transaction.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [transaction.type === 'expense' ? 'expenses' : 'incomes'],
      })
      setError('')
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update transaction')
    },
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      title: form.title,
      amount: Number(form.amount),
      date: form.date,
      category: form.category || undefined,
    })
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Transaction</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Type:</Typography>
            <Chip
              label={transaction?.type}
              size="small"
              color={transaction?.type === 'income' ? 'success' : 'error'}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">(cannot be changed)</Typography>
          </Box>

          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
            autoFocus
            helperText="Letters, numbers, spaces, underscores only"
          />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Category (optional)"
            name="category"
            value={form.category}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {filteredCategories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditTransactionDialog
