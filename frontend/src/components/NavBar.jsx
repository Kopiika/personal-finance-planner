import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import useAuth from '../hooks/useAuth'
import { useThemeMode } from '../context/ThemeContext'

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Categories', path: '/categories' },
]

const DRAWER_WIDTH = 240

const NavBar = () => {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useThemeMode()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || '?'

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const ThemeToggleButton = (
    <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton onClick={toggleDarkMode} color="inherit">
        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  )

  const drawer = (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        onClick={() => setDrawerOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}
      >
        <AccountBalanceWalletIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Finance Planner
        </Typography>
      </Box>
      <Divider />
      <List onClick={() => setDrawerOpen(false)}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {darkMode ? 'Dark mode' : 'Light mode'}
        </Typography>
        {ThemeToggleButton}
      </Box>
      <Divider />
      {user && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">@{user.username}</Typography>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={logout}
            sx={{ mt: 1.5, borderRadius: 2 }}
          >
            Sign out
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar sx={{ gap: 1 }}>
          {/* Mobile burger */}
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { sm: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <AccountBalanceWalletIcon color="primary" sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            My Finance Planner
          </Typography>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive(item.path) ? 700 : 400,
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Theme toggle — desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {ThemeToggleButton}
          </Box>

          {/* User avatar */}
          {user && (
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0, ml: 0.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                {initials}
              </Avatar>
            </IconButton>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">@{user?.username}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={logout}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <nav>
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </>
  )
}

export default NavBar
