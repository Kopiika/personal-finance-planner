const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const expensesRouter = require('./controllers/expenses')
const incomesRouter = require('./controllers/incomes')
const categoriesRouter = require('./controllers/categories')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

const app = express()

logger.info('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI, { family: 4 })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/expenses', expensesRouter)
app.use('/api/incomes', incomesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

app.use('/api', middleware.unknownEndpoint)

app.get("/{*path}", (request, response) => {
  response.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(middleware.errorHandler)



module.exports = app