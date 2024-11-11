const Blog = require('../models/blog')
const User = require('../models/user')
const blogRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const config = require('../utils/config')
const middleware = require('../utils/middleware')


blogRouter.get('/', async(request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogRouter.post('/', middleware.userExtractor, async(request, response) => {

  const decodedData = request.user
  const user = await User.findOne({ username: decodedData.username })
  if(!user) return response.status(401).end()

  request.body.user = user._id
  const blog = new Blog(request.body)
  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog.id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', middleware.userExtractor, async(request, response) =>
{
  const decodedData = request.user

  const user = await User.findOne({ username: decodedData.username })
  if(!user) return response.status(401).end()

  const id = request.params.id
  const targetBlog = await Blog.findById(id)
  if(!targetBlog) return response.status(404).json({ error: `the blog with ${id} ID is already deleted` })
  if(targetBlog.user.toString() !== user._id.toString()) return response
    .status(401)
    .json({ error: 'You don\'t have a permission to delete this blog' })

  const blog = await Blog.findByIdAndDelete(id)
  response.json(blog).end()
})

blogRouter.put('/:id', async(request, response) =>
{
  const body = request.body
  const id = request.params.id
  const updatedBlog = await Blog.findByIdAndUpdate(id, body, { new: true, runValidators: true, context: 'query' })
  response.json(updatedBlog)
})

module.exports = blogRouter