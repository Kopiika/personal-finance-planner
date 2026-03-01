const categoriesRouter = require('express').Router()
const Category = require('../models/category')
const middleware = require('../utils/middleware')

// GET all categories
categoriesRouter.get('/', middleware.userExtractor, async (request, response) => {
	const userId = request.user._id
	const categories = await Category
		.find({
			$or: [
      { default: true },         // default categories
      { user: userId }           // users categories
    ]
		})
		.populate('user', {username: 1, name: 1})
	response.json(categories)
})

// GET a category by ID
categoriesRouter.get('/:id',middleware.userExtractor, async (request, response) => {
	const category = await Category.findById(request.params.id)
	if (!category) return response.status(404).json({ error: 'category not found' })

		// Check if the category belongs to the user or is the default
		if (!category.default && category.user.toString() !== request.user._id.toString()) {
		  return response.status(401).json({ error: 'unauthorized' })
		}
	 
		response.json(category)
})

// PUT update category
categoriesRouter.put('/:id', middleware.userExtractor, async (request, response, next) => {
	const body = request.body
	const category = await Category.findById(request.params.id)
	if (!category) return response.status(404).json({ error: 'category not found' })
	if (category.default) return response.status(401).json({ error: 'cannot edit default category' })
	if (category.user.toString() !== request.user._id.toString()) {
		return response.status(401).json({ error: 'only the creator can edit this category' })
	}
	try{
		const updatedCategory = await Category.findByIdAndUpdate(
			request.params.id,
			{ name: body.name, color: body.color },
			{ new: true, runValidators: true }
		 ).populate('user', { username: 1, name: 1 })
		 response.json(updatedCategory)
	} catch (error) {
     next(error)
  	}
 })

// POST a new category
categoriesRouter.post('/', middleware.userExtractor, async (request, response, next) => {
		const body = request.body
		const user = request.user

		const category = new Category({
			name: body.name,
			type: body.type,
			color: body.color,
			user: user._id,
			default: false
		})

		try {
			const savedCategory = await category.save()
			/*user.categories = user.categories.concat(savedCategory._id)
			await user.save()
			await savedCategory.populate('user', { username: 1, name: 1 })*/
			response.status(201).json(savedCategory)
		} catch (error) {
			next(error)
		}
		
	})
	 
// DELETE a category by ID
categoriesRouter.delete(
	'/:id', 
	middleware.userExtractor, 
	async (request, response) => {
		const category = await Category.findById(request.params.id)
			if (!category) {
				return response
				.status(404)
				.json({ error: 'category not found' })
				.end()
			}

			// cannot delete default categories
			if (category.default) {
				return response.status(401).json({ error: 'cannot delete default category' })
			}
		 
			if (category.user.toString() !== request.user._id.toString()) {
			  return response
			  .status(401)
			  .json({ error: 'only the creator can delete this category' })
			}
		 
			await category.deleteOne()
			response.status(204).end()
})

module.exports = categoriesRouter