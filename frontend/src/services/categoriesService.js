import api from './api'

const getAll = async () => {
  const { data } = await api.get('/categories')
  return data
}

const create = async (category) => {
  const { data } = await api.post('/categories', category)
  return data
}

const update = async (id, data) => {
  const { data: res } = await api.put(`/categories/${id}`, data)
  return res
}

const remove = async (id) => {
  await api.delete(`/categories/${id}`)
}

export default { getAll, create, update, remove }
