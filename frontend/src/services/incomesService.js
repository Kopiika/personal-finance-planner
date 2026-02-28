import api from './api'

const getAll = async () => {
  const { data } = await api.get('/incomes')
  return data
}

const create = async (income) => {
  const { data } = await api.post('/incomes', income)
  return data
}

export default { getAll, create }
