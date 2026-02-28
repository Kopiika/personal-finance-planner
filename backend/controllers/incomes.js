const incomesRouter = require('express').Router()
const Income = require('../models/income')
const Category = require('../models/category')
const middleware = require('../utils/middleware')

// GET all incomes (optional ?category=<id> filter)
incomesRouter.get('/', middleware.userExtractor, async (request, response, next) => {
	try {
		const filter = { user: request.user._id }
		if (request.query.category) filter.category = request.query.category

		const incomes = await Income
			.find(filter)
			.populate('user', {username: 1, name: 1})
			.populate('category', { name: 1, color: 1 })
		response.json(incomes)
	} catch (error) {
		next(error)
	}
})

// GET a income by ID
incomesRouter.get('/:id', middleware.userExtractor, async (request, response, next) => {
	try {
		const income = await Income.findById(request.params.id)
			.populate('category', { name: 1, color: 1 })
		if (!income) return response.status(404).json({ error: 'income not found' })
		if (income.user.toString() !== request.user._id.toString()) {
			return response.status(401).json({ error: 'unauthorized' })
		}
		response.json(income)
	} catch (error) {
		next(error)
	}
})

// PUT update income
incomesRouter.put('/:id', middleware.userExtractor, async (request, response, next) => {
	const body = request.body
	const user = request.user
	const income = await Income.findById(request.params.id)
	if (!income) return response.status(404).json({ error: 'income not found' })
	if (income.user.toString() !== user._id.toString()) {
		return response.status(401).json({ error: 'only the creator can edit this income' })
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

		const updatedIncome = await Income.findByIdAndUpdate(
		  request.params.id,
		  { title: body.title,
			 amount: body.amount,
			 date: body.date,
			 category: body.category },
		  { new: true, runValidators: true }
		).populate('user', { username: 1, name: 1 })
		  .populate('category', { name: 1, color: 1 })

		response.json(updatedIncome)
	 } catch (error) {
		next(error)
	 }
 })

// POST a new income
incomesRouter.post('/', middleware.userExtractor, async (request, response, next) => {
		const body = request.body
		const user = request.user

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

			const income = new Income({
				title: body.title,
				amount: body.amount,
				date: body.date || Date.now(),
				category: body.category,
				user: user._id
			})

			const savedIncome = await income.save()
			response.status(201).json(savedIncome)
		} catch (error){
			next(error)
		}
	})

// DELETE a income by ID
incomesRouter.delete(
	'/:id',
	middleware.userExtractor,
	async (request, response) => {
		const income = await Income.findById(request.params.id)
			if (!income) {
				return response
				.status(404)
				.json({ error: 'income not found' })
				.end()
			}

			if (income.user.toString() !== request.user._id.toString()) {
			  return response
			  .status(401)
			  .json({ error: 'only the creator can delete this income' })
			}

			await income.deleteOne()
			response.status(204).end()
})

module.exports = incomesRouter
