const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'username is required'],
    unique: true,
		minlength: 3,
		validate: {
		validator: function(v) {
		  return /^[A-Za-z0-9_\s]+$/.test(v) // only letters, spaces, numbers, underlines allowed	
		},
      message: props => `${props.value} contains invalid characters. Only letters, spaces, numbers, underlines are allowed!`
	}
  },

  name: {
    type: String,
    required: [true, 'name is required'],
    minlength: 3,
    validate: {
		validator: function(v) {
		  return /^[A-Za-z\s]+$/.test(v) // only letters and spaces allowed	
		},
      message: props => `${props.value} contains invalid characters. Only letters and spaces are allowed!`
	}
  },

  passwordHash: {
    type: String,
    required: [true, 'password is required']
  }
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User