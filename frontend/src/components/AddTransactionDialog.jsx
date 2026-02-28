import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import expensesService from '../services/expensesService'
import incomesService from '../services/incomesService'
import categoriesService from '../services/categoriesService'
import dayjs from 'dayjs'

const defaultForm = {
  title: '',
  amount: '',
  date: dayjs().format('YYYY-MM-DD'),
  type: 'expense',
  category: '',
}

const AddTransactionDialog = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    enabled: open,
  })

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const mutation = useMutation({
    mutationFn: (data) => {
      const service = data.type === 'expense' ? expensesService : incomesService
      const { type, ...payload } = data
      return service.create(payload)
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'expense') {
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['incomes'] })
      }
      setForm(defaultForm)
      setError('')
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to save transaction')
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { category: '' } : {}),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      ...form,
      amount: Number(form.amount),
      category: form.category || undefined,
    })
  }

  const handleClose = () => {
    setForm(defaultForm)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Transaction</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
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
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddTransactionDialog
