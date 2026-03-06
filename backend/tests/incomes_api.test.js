const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = require('../app')
const User = require('../models/user')
const Category = require('../models/category')
const Income = require('../models/income')
const helper = require('./test_helper')

const api = supertest(app)

describe('incomes API', () => {
  let token
  let userId
  let categoryId

  beforeEach(async () => {
    await Income.deleteMany({})
    await Category.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('testpass', 10)
    const user = new User({ username: 'testuser', name: 'Test User', passwordHash })
    await user.save()
    userId = user._id

    token = jwt.sign({ username: user.username, id: user._id }, process.env.SECRET)

    const category = new Category({
      name: 'Salary',
      type: 'income',
      color: '#00ff00',
      user: user._id,
    })
    await category.save()
    categoryId = category._id

    const income = new Income({
      title: 'Monthly salary',
      amount: 3000,
      category: categoryId,
      user: userId,
    })
    await income.save()
  })

  // GET all
  describe('GET /api/incomes', () => {
    test('returns incomes as JSON', async () => {
      await api
        .get('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('returns only the current user\'s incomes', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()

      const inc2 = new Income({ title: 'Freelance work', amount: 500, user: user2._id })
      await inc2.save()

      const res = await api
        .get('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.length, 1)
      assert.strictEqual(res.body[0].title, 'Monthly salary')
    })

    test('category is populated with name and color', async () => {
      const res = await api
        .get('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(typeof res.body[0].category, 'object')
      assert.strictEqual(res.body[0].category.name, 'Salary')
      assert.strictEqual(res.body[0].category.color, '#00ff00')
    })

    test('fails with 401 without token', async () => {
      await api.get('/api/incomes').expect(401)
    })

    test('can filter by category id', async () => {
      const category2 = new Category({ name: 'Investments', type: 'income', user: userId })
      await category2.save()
      const inc2 = new Income({ title: 'Dividends', amount: 200, category: category2._id, user: userId })
      await inc2.save()

      const res = await api
        .get(`/api/incomes?category=${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.length, 1)
      assert.strictEqual(res.body[0].title, 'Monthly salary')
    })
  })

  // GET by ID
  describe('GET /api/incomes/:id', () => {
    test('returns a specific income', async () => {
      const incomes = await helper.incomesInDb()
      const income = incomes[0]

      const res = await api
        .get(`/api/incomes/${income.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Monthly salary')
      assert.strictEqual(res.body.amount, 3000)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .get(`/api/incomes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('fails with 400 for invalid id format', async () => {
      await api
        .get('/api/incomes/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('fails with 401 if income belongs to another user', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const incomes = await helper.incomesInDb()
      await api
        .get(`/api/incomes/${incomes[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)
    })
  })

  // POST
  describe('POST /api/incomes', () => {
    test('creates a new income with valid data', async () => {
      const newIncome = { title: 'Bonus payment', amount: 500, category: categoryId.toString() }

      const res = await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Bonus payment')
      assert.strictEqual(res.body.amount, 500)

      const incomes = await helper.incomesInDb()
      assert.strictEqual(incomes.length, 2)
    })

    test('date defaults to current date if not provided', async () => {
      const newIncome = { title: 'Side income', amount: 100 }

      const res = await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(201)

      assert(res.body.date)
    })

    test('fails with 401 without token', async () => {
      const newIncome = { title: 'Bonus', amount: 500 }
      await api.post('/api/incomes').send(newIncome).expect(401)

      const incomes = await helper.incomesInDb()
      assert.strictEqual(incomes.length, 1)
    })

    test('fails with 400 if title is missing', async () => {
      const newIncome = { amount: 100 }
      await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(400)

      const incomes = await helper.incomesInDb()
      assert.strictEqual(incomes.length, 1)
    })

    test('fails with 400 if amount is missing', async () => {
      const newIncome = { title: 'Missing amount' }
      await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(400)

      const incomes = await helper.incomesInDb()
      assert.strictEqual(incomes.length, 1)
    })

    test('fails with 400 if title is too short', async () => {
      const newIncome = { title: 'A', amount: 100 }
      await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(400)
    })

    test('fails with 400 if category belongs to another user', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const otherCat = new Category({ name: 'Private income', type: 'income', user: user2._id })
      await otherCat.save()

      const newIncome = { title: 'Test income', amount: 100, category: otherCat._id.toString() }
      await api
        .post('/api/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send(newIncome)
        .expect(400)
    })
  })

  // PUT
  describe('PUT /api/incomes/:id', () => {
    test('updates an income successfully', async () => {
      const incomes = await helper.incomesInDb()
      const income = incomes[0]

      const res = await api
        .put(`/api/incomes/${income.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated salary', amount: 3500 })
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Updated salary')
      assert.strictEqual(res.body.amount, 3500)
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const incomes = await helper.incomesInDb()
      await api
        .put(`/api/incomes/${incomes[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked', amount: 1 })
        .expect(401)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .put(`/api/incomes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', amount: 100 })
        .expect(404)
    })

    test('fails with 400 if updated title is invalid', async () => {
      const incomes = await helper.incomesInDb()
      await api
        .put(`/api/incomes/${incomes[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'A', amount: 100 })
        .expect(400)
    })
  })

  // DELETE
  describe('DELETE /api/incomes/:id', () => {
    test('deletes an income successfully', async () => {
      const incomes = await helper.incomesInDb()
      const income = incomes[0]

      await api
        .delete(`/api/incomes/${income.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const incomesAfter = await helper.incomesInDb()
      assert.strictEqual(incomesAfter.length, 0)
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const incomes = await helper.incomesInDb()
      await api
        .delete(`/api/incomes/${incomes[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)

      const incomesAfter = await helper.incomesInDb()
      assert.strictEqual(incomesAfter.length, 1)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .delete(`/api/incomes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
