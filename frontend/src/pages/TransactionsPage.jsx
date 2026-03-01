import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NavBar from '../components/NavBar'
import EditTransactionDialog from '../components/EditTransactionDialog'
import expensesService from '../services/expensesService'
import incomesService from '../services/incomesService'
import categoriesService from '../services/categoriesService'

const TransactionsPage = () => {
  const queryClient = useQueryClient()

  // Period
  const [period, setPeriod] = useState(() => dayjs().startOf('month'))

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // Dialogs
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesService.getAll,
  })

  const { data: incomes = [], isLoading: incLoading } = useQuery({
    queryKey: ['incomes'],
    queryFn: incomesService.getAll,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }) =>
      type === 'expense' ? expensesService.remove(id) : incomesService.remove(id),
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: [type === 'expense' ? 'expenses' : 'incomes'] })
      setDeleteTarget(null)
    },
  })

  // Merge and tag all transactions for the selected period
  const allRows = useMemo(() => {
    const start = period.startOf('month')
    const end = period.endOf('month')

    const inPeriod = (item) => {
      const d = dayjs(item.date)
      return d.isAfter(start.subtract(1, 'ms')) && d.isBefore(end.add(1, 'ms'))
    }

    const expRows = expenses.filter(inPeriod).map((e) => ({ ...e, type: 'expense' }))
    const incRows = incomes.filter(inPeriod).map((i) => ({ ...i, type: 'income' }))

    return [...expRows, ...incRows].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
  }, [expenses, incomes, period])

  // Category options based on type filter
  const categoryOptions = useMemo(() => {
    if (typeFilter === 'all') return categories
    return categories.filter((c) => c.type === typeFilter)
  }, [categories, typeFilter])

  // Apply filters
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false
      if (categoryFilter && row.category?.id !== categoryFilter) return false
      if (minAmount !== '' && row.amount < Number(minAmount)) return false
      if (maxAmount !== '' && row.amount > Number(maxAmount)) return false
      return true
    })
  }, [allRows, typeFilter, categoryFilter, minAmount, maxAmount])

  // Summary of filtered rows
  const summary = useMemo(() => {
    const income = filteredRows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.amount, 0)
    const expense = filteredRows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0)
    return { income, expense, balance: income - expense }
  }, [filteredRows])

  const handleTypeFilter = (value) => {
    setTypeFilter(value)
    setCategoryFilter('')
  }

  const isLoading = expLoading || incLoading

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar />

      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>

        {/* Period navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => setPeriod((p) => p.subtract(1, 'month'))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 160, textAlign: 'center' }}>
            {period.format('MMMM YYYY')}
          </Typography>
          <IconButton
            onClick={() => setPeriod((p) => p.add(1, 'month'))}
            disabled={period.isSame(dayjs().startOf('month'), 'month')}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            {/* Type toggle */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {['all', 'expense', 'income'].map((t) => (
                <Button
                  key={t}
                  size="small"
                  variant={typeFilter === t ? 'contained' : 'outlined'}
                  color={t === 'expense' ? 'error' : t === 'income' ? 'success' : 'primary'}
                  onClick={() => handleTypeFilter(t)}
                  sx={{ borderRadius: 2, textTransform: 'capitalize' }}
                >
                  {t === 'all' ? 'All' : t}
                </Button>
              ))}
            </Box>

            {/* Category */}
            <TextField
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All categories</MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>

            {/* Amount range */}
            <TextField
              label="Min amount"
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Max amount"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 0, step: '0.01' }}
            />

            {/* Reset */}
            {(typeFilter !== 'all' || categoryFilter || minAmount || maxAmount) && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setTypeFilter('all')
                  setCategoryFilter('')
                  setMinAmount('')
                  setMaxAmount('')
                }}
              >
                Reset filters
              </Button>
            )}
          </Box>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={`${row.type}-${row.id}`} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {dayjs(row.date).format('DD MMM')}
                    </TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        size="small"
                        color={row.type === 'income' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.category ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: row.category.color || 'grey.400',
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2">{row.category.name}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: row.type === 'income' ? 'success.main' : 'error.main' }}
                      >
                        {row.type === 'income' ? '+' : '-'}${row.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditTarget(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(row)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        {!isLoading && filteredRows.length > 0 && (
          <Paper elevation={1} sx={{ borderRadius: 3, px: 3, py: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Summary ({filteredRows.length} transaction{filteredRows.length !== 1 ? 's' : ''})
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Income</Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  +${summary.income.toFixed(2)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Expenses</Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  -${summary.expense.toFixed(2)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Balance</Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={summary.balance >= 0 ? 'success.main' : 'error.main'}
                >
                  {summary.balance >= 0 ? '+' : ''}${summary.balance.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      <EditTransactionDialog
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        transaction={editTarget}
      />

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete transaction?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: deleteTarget.id, type: deleteTarget.type })}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TransactionsPage
