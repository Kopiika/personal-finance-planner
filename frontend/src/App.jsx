import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import { ThemeContextProvider, useThemeMode } from './context/ThemeContext'
import router from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

const ThemedApp = () => {
  const { darkMode } = useThemeMode()

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: '#1976d2' },
        },
        shape: { borderRadius: 8 },
      }),
    [darkMode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeContextProvider>
      <ThemedApp />
    </ThemeContextProvider>
  </QueryClientProvider>
)

export default App
