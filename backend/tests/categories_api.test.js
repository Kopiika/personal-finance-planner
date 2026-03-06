const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = require('../app')
const User = require('../models/user')
const Category = require('../models/category')
const helper = require('./test_helper')

const api = supertest(app)

describe('categories API', () => {
  let token
  let userId
  let userCategory
  let defaultCategory

  beforeEach(async () => {
    await Category.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('testpass', 10)
    const user = new User({ username: 'testuser', name: 'Test User', passwordHash })
    await user.save()
    userId = user._id

    token = jwt.sign({ username: user.username, id: user._id }, process.env.SECRET)

    defaultCategory = new Category({
      name: 'General',
      type: 'expense',
      color: '#aaaaaa',
      default: true,
    })
    await defaultCategory.save()

    userCategory = new Category({
      name: 'Groceries',
      type: 'expense',
      color: '#ff0000',
      user: userId,
    })
    await userCategory.save()
  })

  // GET all
  describe('GET /api/categories', () => {
    test('returns categories as JSON', async () => {
      await api
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('returns default categories and the user\'s own categories', async () => {
      const res = await api
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.length, 2)
      const names = res.body.map(c => c.name)
      assert(names.includes('General'))
      assert(names.includes('Groceries'))
    })

    test('does not return categories belonging to other users', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const otherCat = new Category({ name: 'Private', type: 'expense', user: user2._id })
      await otherCat.save()

      const res = await api
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const names = res.body.map(c => c.name)
      assert(!names.includes('Private'))
    })

    test('fails with 401 without token', async () => {
      await api.get('/api/categories').expect(401)
    })
  })

  // GET by ID
  describe('GET /api/categories/:id', () => {
    test('returns a specific user category', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      const res = await api
        .get(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.name, 'Groceries')
    })

    test('returns a default category', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'General')

      const res = await api
        .get(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.name, 'General')
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .get(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('fails with 400 for invalid id format', async () => {
      await api
        .get('/api/categories/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('fails with 401 if category belongs to another user', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      await api
        .get(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)
    })
  })

  // POST
  describe('POST /api/categories', () => {
    test('creates a new category with valid data', async () => {
      const newCategory = { name: 'Transport', type: 'expense', color: '#0000ff' }

      const res = await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.name, 'Transport')
      assert.strictEqual(res.body.type, 'expense')
      assert.strictEqual(res.body.default, false)

      const categories = await helper.categoriesInDb()
      const names = categories.map(c => c.name)
      assert(names.includes('Transport'))
    })

    test('creates an income type category', async () => {
      const newCategory = { name: 'Freelance', type: 'income', color: '#00ff00' }

      const res = await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(201)

      assert.strictEqual(res.body.type, 'income')
    })

    test('fails with 401 without token', async () => {
      const newCategory = { name: 'Transport', type: 'expense' }
      await api.post('/api/categories').send(newCategory).expect(401)
    })

    test('fails with 400 if name is missing', async () => {
      const newCategory = { type: 'expense', color: '#0000ff' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })

    test('fails with 400 if type is missing', async () => {
      const newCategory = { name: 'No type', color: '#0000ff' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })

    test('fails with 400 if type is invalid', async () => {
      const newCategory = { name: 'Bad type', type: 'both' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })

    test('fails with 400 if name is too short', async () => {
      const newCategory = { name: 'A', type: 'expense' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })

    test('fails with 400 if duplicate name for same user', async () => {
      const newCategory = { name: 'Groceries', type: 'expense' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })

    test('fails with 400 if color format is invalid', async () => {
      const newCategory = { name: 'Bad color', type: 'expense', color: 'red' }
      await api
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory)
        .expect(400)
    })
  })

  // PUT
  describe('PUT /api/categories/:id', () => {
    test('updates a user category successfully', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      const res = await api
        .put(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Supermarket', color: '#ff5500' })
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.name, 'Supermarket')
      assert.strictEqual(res.body.color, '#ff5500')
    })

    test('fails with 401 when trying to edit a default category', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'General')

      await api
        .put(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Changed', color: '#000000' })
        .expect(401)
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      await api
        .put(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Hacked', color: '#000000' })
        .expect(401)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', color: '#000000' })
        .expect(404)
    })
  })

  // DELETE
  describe('DELETE /api/categories/:id', () => {
    test('deletes a user category successfully', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      await api
        .delete(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const categoriesAfter = await helper.categoriesInDb()
      const names = categoriesAfter.map(c => c.name)
      assert(!names.includes('Groceries'))
    })

    test('fails with 401 when trying to delete a default category', async () => {
      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'General')

      await api
        .delete(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401)

      const categoriesAfter = await helper.categoriesInDb()
      const names = categoriesAfter.map(c => c.name)
      assert(names.includes('General'))
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const categories = await helper.categoriesInDb()
      const cat = categories.find(c => c.name === 'Groceries')

      await api
        .delete(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)

      const categoriesAfter = await helper.categoriesInDb()
      const names = categoriesAfter.map(c => c.name)
      assert(names.includes('Groceries'))
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
