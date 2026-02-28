const expensesRouter = require('express').Router()
const Expense = require('../models/expense')
const middleware = require('../utils/middleware')
const Category = require('../models/category')

// GET all expenses (optional ?category=<id> filter)
expensesRouter.get('/', middleware.userExtractor, async (request, response, next) => {
	try {
		const filter = { user: request.user._id }
		if (request.query.category) filter.category = request.query.category

		const expenses = await Expense
			.find(filter)
			.populate('user', {username: 1, name: 1})
			.populate('category', { name: 1, color: 1 })
		response.json(expenses)
	} catch (error) {
		next(error)
	}
})

// GET a expense by ID
expensesRouter.get('/:id', middleware.userExtractor, async (request, response, next) => {
	try {
		const expense = await Expense.findById(request.params.id)
			.populate('category', { name: 1, color: 1 })
		if (!expense) return response.status(404).json({ error: 'expense not found' })
		if (expense.user.toString() !== request.user._id.toString()) {
			return response.status(401).json({ error: 'unauthorized' })
		}
		response.json(expense)
	} catch (error) {
		next(error)
	}
})

// PUT update expense
expensesRouter.put('/:id', middleware.userExtractor, async (request, response, next) => {
	const body = request.body
	const user = request.user
	const expense = await Expense.findById(request.params.id)
	if (!expense) return response.status(404).json({ error: 'expense not found' })
	if (expense.user.toString() !== user._id.toString()) {
		return response.status(401).json({ error: 'only the creator can edit this expense' })
	}

	try {
		if (body.category) {
			const category = await Category.findById(body.category)
			if (
				!category ||
				(!category.default && category.user.toString() !== user._id.toString())
			) {
				return response.status(400).json({ error: 'invalid category' })
			}
		}

		const updatedExpense = await Expense.findByIdAndUpdate(
		  request.params.id,
		  { title: body.title,
			 amount: body.amount,
			 date: body.date,
			 category: body.category },
		  { new: true, runValidators: true }
		).populate('user', { username: 1, name: 1 })
		  .populate('category', { name: 1, color: 1 })

		response.json(updatedExpense)
	} catch (error) {
		next(error)
	}
})

// POST a new expense
expensesRouter.post('/', middleware.userExtractor, async (request, response, next) => {
		const body = request.body
		const user = request.user

		try {
			//CHECK CATEGORY ACCESS
			if (body.category) {
				const category = await Category.findById(body.category)
		
				if (
				  !category ||
				  (!category.default && category.user.toString() !== user._id.toString())
				) {
				  return response.status(400).json({ error: 'invalid category' })
				}
			 }
			
			const expense = new Expense({
				title: body.title,
				amount: body.amount,
				date: body.date || Date.now(),
				category: body.category,
				user: user._id
			})
	
			 const savedExpense = await expense.save()
			/*user.expenses = user.expenses.concat(savedExpense._id)
			await user.save()*/
			response.status(201).json(savedExpense)
		} catch (error){
			next(error)
		}
	})
	 
// DELETE a expense by ID
expensesRouter.delete(
	'/:id', 
	middleware.userExtractor, 
	async (request, response) => {
		const expense = await Expense.findById(request.params.id)
			if (!expense) {
				return response
				.status(404)
				.json({ error: 'expense not found' })
				.end()
			}
		 
			if (expense.user.toString() !== request.user._id.toString()) {
			  return response
			  .status(401)
			  .json({ error: 'only the creator can delete this expense' })
			}
		 
			await expense.deleteOne()
			response.status(204).end()
})

module.exports = expensesRouter