const mongoose = require('mongoose')

const incomeSchema = new mongoose.Schema({
	  title: {
		type: String,
		required: [true, 'income title required'],
		minlength: 2,
		validate: {
		validator: function(v) {
			return /^[A-Za-z0-9_\s]+$/.test(v) // only letters, spaces, numbers, underlines are allowed	
		},
		message: props => `${props.value} contains invalid characters. Only letters spaces, numbers, underlines are allowed!`
	 }		
	  },
	  amount: {
		type: Number,
		required: [true, 'Income amount required'],
		min: 0
	  },
	  date: {
		type: Date,
		default: Date.now
	},
	  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
	  user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	  }
})

incomeSchema.set('toJSON', {
  transform: (document, returnedObject) => {
	 returnedObject.id = returnedObject._id.toString()
	 delete returnedObject._id
	 delete returnedObject.__v
  }
})

module.exports = mongoose.model('Income', incomeSchema)