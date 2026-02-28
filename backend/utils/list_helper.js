const _ = require('lodash')

const dummy = (blogs) => {
	return 1
 }

 const totalLikes = (blogs) => {
	return blogs.reduce((sum, blog) => sum + blog.likes, 0)
 }

 const favoriteBlog = (blogs) => {
	if(blogs.length === 0) return null
	return blogs.reduce((favorite, blog) => {
		return (favorite.likes > blog.likes) ? favorite : blog
	}) 
 }

 const mostBlogs = (blogs) => {
	if(blogs.length === 0) return null
	const groupedByAuthor = _.groupBy(blogs, 'author')
	const authorBlogCounts = _.mapValues(groupedByAuthor, authorBlogs => authorBlogs.length)
	const maxBlogsAuthor = _.maxBy(_.keys(authorBlogCounts), author => authorBlogCounts[author])
	return {
		author: maxBlogsAuthor, 
		blogs: authorBlogCounts[maxBlogsAuthor]
	}
 }

 const mostLikes = (blogs)=>{
	if(blogs.length === 0) return null
	const groupedByAuthor = _.groupBy(blogs, 'author')
	const authorLikeCounts = _.mapValues(groupedByAuthor, authorBlogs => 
		authorBlogs.reduce((sum, blog) => sum + blog.likes, 0))
	const maxLikesAuthor = _.maxBy(_.keys(authorLikeCounts), author => authorLikeCounts[author])
	return {
		author: maxLikesAuthor,
		likes: authorLikeCounts [maxLikesAuthor]
	}

 }
 
 module.exports = {
	dummy,
	totalLikes,
	favoriteBlog,
	mostBlogs,
	mostLikes,
 }