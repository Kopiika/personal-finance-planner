const Expense = require('../models/expense')
const Income = require('../models/income')
const Category = require('../models/category')
const User = require('../models/user')

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const expensesInDb = async () => {
  const expenses = await Expense.find({})
  return expenses.map(e => e.toJSON())
}

const incomesInDb = async () => {
  const incomes = await Income.find({})
  return incomes.map(i => i.toJSON())
}

const categoriesInDb = async () => {
  const categories = await Category.find({})
  return categories.map(c => c.toJSON())
}

module.exports = {
  usersInDb,
  expensesInDb,
  incomesInDb,
  categoriesInDb,
}
