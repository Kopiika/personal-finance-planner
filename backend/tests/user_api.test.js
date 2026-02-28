const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

	 /*test('creation fails when password is too short', async () => {
		const newUser = {
		  username: 'validname',
		  name: 'Test User',
		  password: '12'
		}
	 
		const result = await api
		  .post('/api/users')
		  .send(newUser)
		  .expect(400)
	 
		assert(result.body.error.includes('password'))
	 })*/
	 

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
	const usersAtStart = await helper.usersInDb()

	const newUser = {
	  username: 'root',
	  name: 'Superuser',
	  password: 'salainen',
	}

	const result = await api
	  .post('/api/users')
	  .send(newUser)
	  .expect(400)
	  .expect('Content-Type', /application\/json/)

	const usersAtEnd = await helper.usersInDb()
	assert(result.body.error.includes('expected `username` to be unique'))

	assert.strictEqual(usersAtEnd.length, usersAtStart.length)
 })
})

// close the database after tests
after(async () => {
	await mongoose.connection.close()
 })