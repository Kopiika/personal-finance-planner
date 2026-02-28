const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
	 title: 'First test blog',
	 author: 'Tester One',
	 url: 'http://example.com/test1',
	 likes: 3,
  },
  {
	 title: 'Second test blog',
	 author: 'Tester Two',
	 url: 'http://example.com/test2',
	 likes: 7,
  },
]

const nonExistingId = async () => {
  const blog = new Blog({ 
	 title: 'Temporary',
    author: 'Temp Author',
    url: 'http://example.com/temp',
	 likes: 0 
})
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
}