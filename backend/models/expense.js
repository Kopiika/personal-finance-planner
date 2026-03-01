const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
	  title: {
		type: String,
		required: [true, 'Expense title required'],
		minlength: 2,
		validate: {
      validator: function(v) {
        return /^[A-Za-z0-9\s&()\-_.]+$/.test(v); // only letters, spaces, numbers, underlines, brackets, hyphens, periods, underscores are allowed
      },
      message: props => `${props.value} contains invalid characters. Only letters spaces, numbers, underlines are allowed!`
    }		
	  },
	  amount: {
		type: Number,
		required: [true, 'Expense amount required'],
		default: 0,
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

expenseSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Expense', expenseSchema)