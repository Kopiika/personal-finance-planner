const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = require('../app')
const User = require('../models/user')
const Category = require('../models/category')
const Expense = require('../models/expense')
const helper = require('./test_helper')

const api = supertest(app)

describe('expenses API', () => {
  let token
  let userId
  let categoryId

  beforeEach(async () => {
    await Expense.deleteMany({})
    await Category.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('testpass', 10)
    const user = new User({ username: 'testuser', name: 'Test User', passwordHash })
    await user.save()
    userId = user._id

    token = jwt.sign({ username: user.username, id: user._id }, process.env.SECRET)

    const category = new Category({
      name: 'Food',
      type: 'expense',
      color: '#ff0000',
      user: user._id,
    })
    await category.save()
    categoryId = category._id

    const expense = new Expense({
      title: 'Groceries',
      amount: 50,
      category: categoryId,
      user: userId,
    })
    await expense.save()
  })

  // GET all
  describe('GET /api/expenses', () => {
    test('returns expenses as JSON', async () => {
      await api
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('returns only the current user\'s expenses', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()

      const exp2 = new Expense({ title: 'Other expense', amount: 20, user: user2._id })
      await exp2.save()

      const res = await api
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.length, 1)
      assert.strictEqual(res.body[0].title, 'Groceries')
    })

    test('category is populated with name and color', async () => {
      const res = await api
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(typeof res.body[0].category, 'object')
      assert.strictEqual(res.body[0].category.name, 'Food')
      assert.strictEqual(res.body[0].category.color, '#ff0000')
    })

    test('fails with 401 without token', async () => {
      await api.get('/api/expenses').expect(401)
    })

    test('can filter by category id', async () => {
      const category2 = new Category({ name: 'Transport', type: 'expense', user: userId })
      await category2.save()
      const exp2 = new Expense({ title: 'Bus ticket', amount: 3, category: category2._id, user: userId })
      await exp2.save()

      const res = await api
        .get(`/api/expenses?category=${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      assert.strictEqual(res.body.length, 1)
      assert.strictEqual(res.body[0].title, 'Groceries')
    })
  })

  // GET by ID
  describe('GET /api/expenses/:id', () => {
    test('returns a specific expense', async () => {
      const expenses = await helper.expensesInDb()
      const expense = expenses[0]

      const res = await api
        .get(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Groceries')
      assert.strictEqual(res.body.amount, 50)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .get(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('fails with 400 for invalid id format', async () => {
      await api
        .get('/api/expenses/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('fails with 401 if expense belongs to another user', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const expenses = await helper.expensesInDb()
      await api
        .get(`/api/expenses/${expenses[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)
    })
  })

  // POST
  describe('POST /api/expenses', () => {
    test('creates a new expense with valid data', async () => {
      const newExpense = { title: 'Coffee', amount: 5, category: categoryId.toString() }

      const res = await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Coffee')
      assert.strictEqual(res.body.amount, 5)

      const expenses = await helper.expensesInDb()
      assert.strictEqual(expenses.length, 2)
    })

    test('date defaults to current date if not provided', async () => {
      const newExpense = { title: 'Coffee', amount: 5 }

      const res = await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(201)

      assert(res.body.date)
    })

    test('fails with 401 without token', async () => {
      const newExpense = { title: 'Coffee', amount: 5 }
      await api.post('/api/expenses').send(newExpense).expect(401)

      const expenses = await helper.expensesInDb()
      assert.strictEqual(expenses.length, 1)
    })

    test('fails with 400 if title is missing', async () => {
      const newExpense = { amount: 10 }
      await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(400)

      const expenses = await helper.expensesInDb()
      assert.strictEqual(expenses.length, 1)
    })

    test('amount defaults to 0 when not provided', async () => {
      const newExpense = { title: 'No amount given' }
      const res = await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(201)

      assert.strictEqual(res.body.amount, 0)
    })

    test('fails with 400 if title is too short', async () => {
      const newExpense = { title: 'A', amount: 10 }
      await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(400)
    })

    test('fails with 400 if category belongs to another user', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const otherCat = new Category({ name: 'Private', type: 'expense', user: user2._id })
      await otherCat.save()

      const newExpense = { title: 'Test expense', amount: 10, category: otherCat._id.toString() }
      await api
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(newExpense)
        .expect(400)
    })
  })

  // PUT
  describe('PUT /api/expenses/:id', () => {
    test('updates an expense successfully', async () => {
      const expenses = await helper.expensesInDb()
      const expense = expenses[0]

      const res = await api
        .put(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Groceries', amount: 75 })
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(res.body.title, 'Updated Groceries')
      assert.strictEqual(res.body.amount, 75)
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const expenses = await helper.expensesInDb()
      await api
        .put(`/api/expenses/${expenses[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked', amount: 1 })
        .expect(401)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .put(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', amount: 10 })
        .expect(404)
    })

    test('fails with 400 if updated title is invalid', async () => {
      const expenses = await helper.expensesInDb()
      await api
        .put(`/api/expenses/${expenses[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'A', amount: 10 })
        .expect(400)
    })
  })

  // DELETE
  describe('DELETE /api/expenses/:id', () => {
    test('deletes an expense successfully', async () => {
      const expenses = await helper.expensesInDb()
      const expense = expenses[0]

      await api
        .delete(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const expensesAfter = await helper.expensesInDb()
      assert.strictEqual(expensesAfter.length, 0)
    })

    test('fails with 401 if not the owner', async () => {
      const hash2 = await bcrypt.hash('pass2', 10)
      const user2 = new User({ username: 'otheruser', name: 'Other User', passwordHash: hash2 })
      await user2.save()
      const token2 = jwt.sign({ username: user2.username, id: user2._id }, process.env.SECRET)

      const expenses = await helper.expensesInDb()
      await api
        .delete(`/api/expenses/${expenses[0].id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)

      const expensesAfter = await helper.expensesInDb()
      assert.strictEqual(expensesAfter.length, 1)
    })

    test('fails with 404 for non-existing id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await api
        .delete(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
