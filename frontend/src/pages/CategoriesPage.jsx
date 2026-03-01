import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import categoriesService from '../services/categoriesService'
import NavBar from '../components/NavBar'
import AddCategoryDialog from '../components/AddCategoryDialog'
import EditCategoryDialog from '../components/EditCategoryDialog'

const CategoriesPage = () => {
  const queryClient = useQueryClient()

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteTarget(null)
    },
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  const renderCategory = (cat) => {
    const isDefault = cat.default
    const initial = cat.name[0].toUpperCase()
    const color = cat.color || '#9e9e9e'

    return (
      <Box key={cat.id}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.5,
            '&:hover': { bgcolor: 'grey.50' },
          }}
        >
          <Avatar sx={{ bgcolor: color, width: 40, height: 40, fontSize: 16, fontWeight: 700 }}>
            {initial}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={500} noWrap>
              {cat.name}
            </Typography>
            {isDefault && (
              <Typography variant="caption" color="text.secondary">
                Default
              </Typography>
            )}
          </Box>

          <Tooltip title={isDefault ? 'Cannot edit default category' : 'Edit'}>
            <span>
              <IconButton
                size="small"
                disabled={isDefault}
                onClick={() => setEditTarget(cat)}
                sx={{ color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isDefault ? 'Cannot delete default category' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                disabled={isDefault}
                onClick={() => setDeleteTarget(cat)}
                sx={{ color: isDefault ? undefined : 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Divider sx={{ mx: 2 }} />
      </Box>
    )
  }

  const renderSection = (title, items, chipColor) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        <Chip label={items.length} size="small" color={chipColor} />
      </Box>
      <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {items.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No {title.toLowerCase()} yet
            </Typography>
          </Box>
        ) : (
          items.map(renderCategory)
        )}
      </Paper>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar />

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add category
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {renderSection('Expense categories', expenseCategories, 'error')}
            {renderSection('Income categories', incomeCategories, 'success')}
          </>
        )}
      </Box>

      <AddCategoryDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <EditCategoryDialog
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        category={editTarget}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete category?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CategoriesPage
