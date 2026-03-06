const router = require('express').Router()
const Expense = require('../models/expense')
const Income = require('../models/income')
const Category = require('../models/category')
const User = require('../models/user')

router.post('/reset', async (request, response) => {
  await Expense.deleteMany({})
  await Income.deleteMany({})
  await Category.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = router