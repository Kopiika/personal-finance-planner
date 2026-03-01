import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AddIcon from '@mui/icons-material/Add'
import dayjs from 'dayjs'

import categoriesService from '../services/categoriesService'
import expensesService from '../services/expensesService'
import incomesService from '../services/incomesService'
import NavBar from '../components/NavBar'
import SummaryCard from '../components/SummaryCard'
import CategoryRow from '../components/CategoryRow'
import AddCategoryDialog from '../components/AddCategoryDialog'
import AddTransactionDialog from '../components/AddTransactionDialog'

const thisMonth = (items) => {
  const now = dayjs()
  return items.filter((item) => {
    const d = dayjs(item.date)
    return d.month() === now.month() && d.year() === now.year()
  })
}

const DashboardPage = () => {
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesService.getAll,
  })

  const { data: incomes = [], isLoading: incLoading } = useQuery({
    queryKey: ['incomes'],
    queryFn: incomesService.getAll,
  })

  const isLoading = catsLoading || expLoading || incLoading

  const monthExpenses = thisMonth(expenses)
  const monthIncomes = thisMonth(incomes)

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0)
  const balance = totalIncome - totalExpenses

  const categoryTotals = categories.map((cat) => {
    const catExpenses = monthExpenses
      .filter((e) => e.category?.id === cat.id)
      .reduce((sum, e) => sum + e.amount, 0)
    const catIncomes = monthIncomes
      .filter((i) => i.category?.id === cat.id)
      .reduce((sum, i) => sum + i.amount, 0)
    const amount = cat.type === 'income' ? catIncomes : catExpenses
    return { ...cat, amount }
  }).filter((cat) => cat.amount > 0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <NavBar />

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {dayjs().format('MMMM YYYY')}
        </Typography>

        {/* Summary Cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <SummaryCard
            label="Income"
            amount={totalIncome}
            color="#2e7d32"
            icon={<ArrowUpwardIcon fontSize="small" />}
          />
          <SummaryCard
            label="Expenses"
            amount={totalExpenses}
            color="#c62828"
            icon={<ArrowDownwardIcon fontSize="small" />}
          />
          <SummaryCard
            label="Balance"
            amount={balance}
            color={balance >= 0 ? '#1565c0' : '#b71c1c'}
            icon={<AccountBalanceIcon fontSize="small" />}
          />
        </Box>

        {/* Category list */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Categories this month
        </Typography>

        <Paper sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }} elevation={1}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : categoryTotals.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No transactions this month yet
              </Typography>
            </Box>
          ) : (
            categoryTotals.map((cat, idx) => (
              <Box key={cat.id}>
                <CategoryRow
                  name={cat.name}
                  color={cat.color}
                  amount={cat.amount}
                  type={cat.type}
                />
                {idx < categoryTotals.length - 1 && <Divider sx={{ mx: 2 }} />}
              </Box>
            ))
          )}
        </Paper>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth
            size="large"
            sx={{ borderRadius: 2 }}
            onClick={() => setAddTxOpen(true)}
          >
            Add transaction
          </Button>
        </Box>
      </Box>

      <AddCategoryDialog open={addCatOpen} onClose={() => setAddCatOpen(false)} />
      <AddTransactionDialog open={addTxOpen} onClose={() => setAddTxOpen(false)} />
    </Box>
  )
}

export default DashboardPage
