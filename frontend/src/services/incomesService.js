import api from './api'

const getAll = async () => {
  const { data } = await api.get('/incomes')
  return data
}

const create = async (income) => {
  const { data } = await api.post('/incomes', income)
  return data
}

const update = async (id, data) => {
  const { data: res } = await api.put(`/incomes/${id}`, data)
  return res
}

const remove = async (id) => {
  await api.delete(`/incomes/${id}`)
}

export default { getAll, create, update, remove }
