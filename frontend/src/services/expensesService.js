import api from './api'

const getAll = async () => {
  const { data } = await api.get('/expenses')
  return data
}

const create = async (expense) => {
  const { data } = await api.post('/expenses', expense)
  return data
}

const update = async (id, data) => {
  const { data: res } = await api.put(`/expenses/${id}`, data)
  return res
}

const remove = async (id) => {
  await api.delete(`/expenses/${id}`)
}

export default { getAll, create, update, remove }
