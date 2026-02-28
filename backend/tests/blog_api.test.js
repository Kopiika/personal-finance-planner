const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const api = supertest(app)

describe('when there is initially some blogs saved', () =>{
  let token
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    //await Blog.insertMany(helper.initialBlogs)

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'testuser',
      name: 'Test User',
      passwordHash,
    })

    const savedUser = await user.save()

    token = jwt.sign(
      {
        username: savedUser.username,
        id: savedUser._id,
      },
      process.env.SECRET
    )

    const blogObjects = helper.initialBlogs.map(blog => ({
      ...blog,
      user: savedUser._id,
    }))
  
    await Blog.insertMany(blogObjects)
  })

  //GET
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const titles = response.body.map(e => e.title)
    assert(titles.includes('Second test blog'))
  })

  test('unique identifier property is named id', async () => {
    const response = await api.get('/api/blogs')
    
    const blogs = response.body
    blogs.forEach(blog => {
      assert(blog.id, 'id property is missing')
      assert.strictEqual(typeof blog.id, 'string')
    })
  
    blogs.forEach(blog => {
      assert(!blog._id, '_id should not be returned')
    })
  })

  //GET by id
  describe('viewing a specific blog', ()=>{
    test('a specific blog can be viewed', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToView = blogsAtStart[0]
    
      const resultBlog = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
        assert.strictEqual(resultBlog.body.title, blogToView.title)
        assert.strictEqual(resultBlog.body.author, blogToView.author)
        assert.strictEqual(resultBlog.body.url, blogToView.url)
        assert.strictEqual(resultBlog.body.likes, blogToView.likes)
        assert.strictEqual(resultBlog.body.id, blogToView.id)
    })

    test('fails with statuscode 404 if blog does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId()

      await api.get(`/api/blogs/${validNonexistingId}`).expect(404)
    })

    test('fails with statuscode 400 id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445'

      await api.get(`/api/blogs/${invalidId}`).expect(400)
    })
  })

  //POST
  describe('addition of a new blog', () => {
    test('succeeds with valid data', async () => {
      const newBlog = {
        title: 'Teasting POST request',
        author: 'Test Author',
        url: 'http://example.com/test-blog',
        likes: 5,
      }
    
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
      
        const titles = blogsAtEnd.map(b => b.title)
        assert(titles.includes('Teasting POST request'))
    })

    test('blog without url is not added', async () => {
      const newBlog = {
        title: 'Blog without URL',
        author: 'No URL Author',
        likes: 2,
      }
    
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)
    
      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
    
    test('blog without title is not added', async () => {
      const newBlog = {
        author: 'Missing Title Author',
        url: 'http://example.com/no-title'
      }
    
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)
    
      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
    
    test('if likes property is missing, it defaults to 0', async ()=>{
      const newBlog = {
        title: 'Blog without likes',
        author: 'No Likes Author',
        url: 'http://example.com/no-likes'
      }
      const response =  await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        
      assert.strictEqual(response.body.likes, 0)
    })

    test('adding a blog fails with status code 401 if token is not provided', async () => {
      const newBlog = {
        title: 'Unauthorized blog',
        author: 'No Token',
        url: 'http://example.com/no-token',
        likes: 1,
      }
    
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
    
      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  //PUT
  describe('updating a blog', () => {
    test('succeeds in updating likes', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]
  
      const updatedData = {
        ...blogToUpdate,
        likes: blogToUpdate.likes + 10
      }
  
      const result = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedData)
        .expect(200)
        .expect('Content-Type', /application\/json/)
  
      assert.strictEqual(result.body.likes, blogToUpdate.likes + 10)
    })
  
    test('fails with status 404 if blog does not exist', async () => {
      const nonExistingId = await helper.nonExistingId()
  
      const updatedData = {
        title: 'anything',
        author: 'someone',
        url: 'http://example.com',
        likes: 10
      }
  
      await api
        .put(`/api/blogs/${nonExistingId}`)
        .send(updatedData)
        .expect(404)
    })
  
    test('fails with status 400 if id is invalid', async () => {
      const invalidId = '12345invalidid'
  
      const updatedData = {
        title: 'anything',
        author: 'someone',
        url: 'http://example.com',
        likes: 5
      }
  
      await api
        .put(`/api/blogs/${invalidId}`)
        .send(updatedData)
        .expect(400)
    })
  })
  

  //DELETE
  describe('deletion of a blog', () => {
    test('a blog can be deleted', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]
    
      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)
    
      const blogsAtEnd = await helper.blogsInDb()
    
      const ids = blogsAtEnd.map(b => b.id)
      assert(!ids.includes(blogToDelete.id))
    
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    })
  })
})

// close the database after tests
after(async () => {
  await mongoose.connection.close()
})