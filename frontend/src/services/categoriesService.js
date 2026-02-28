import api from './api'

const getAll = async () => {
  const { data } = await api.get('/categories')
  return data
}

const create = async (category) => {
  const { data } = await api.post('/categories', category)
  return data
}

const remove = async (id) => {
  await api.delete(`/categories/${id}`)
}

export default { getAll, create, remove }
