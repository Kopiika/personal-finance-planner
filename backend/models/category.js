const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
	  name: {
		type: String,
		required: [true, 'category name required'],
		minlength: 2,
		validate: {
		validator: function(v) {
			return /^[A-Za-z0-9\s&()\-_.]+$/.test(v); // only letters, spaces, numbers, underlines, brackets, hyphens, periods, underscores are allowed
		},
		message: props => `${props.value} contains invalid characters. Only letters spaces, numbers, underlines are allowed!`
	 }
	  },
	  type: {
		type: String,
		enum: ['income', 'expense'],
		required: [true, 'category type required']
	  },
	  color: {
		type: String,
		match: /^#([0-9A-Fa-f]{6})$/
	  },
	  user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	  },
	  default: {
		type: Boolean,
		default: false
	}
})

// Unique index: prevents duplicate names per user.
// sparse: true excludes documents without `user` (default categories) from the uniqueness check,
// so default categories can share names without conflicting.
categorySchema.index({ name: 1, user: 1 }, { unique: true, sparse: true })

categorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
	 returnedObject.id = returnedObject._id.toString()
	 delete returnedObject._id
	 delete returnedObject.__v
  }
})

module.exports = mongoose.model('Category', categorySchema)
