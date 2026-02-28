import api from './api'

const login = async (credentials) => {
  const { data } = await api.post('/login', credentials)
  return data // { token, username, name }
}

export default { login }
