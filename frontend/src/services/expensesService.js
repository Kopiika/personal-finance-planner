import api from './api'

const getAll = async () => {
  const { data } = await api.get('/expenses')
  return data
}

const create = async (expense) => {
  const { data } = await api.post('/expenses', expense)
  return data
}

export default { getAll, create }
