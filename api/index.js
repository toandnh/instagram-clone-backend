require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger, logEvents } = require('../middleware/logger')
const errorHandler = require('../middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('../config/corsOptions')
const allowedOrigins = require('../config/allowedOrigins')
const connectDB = require('../config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/posts', require('./routes/postRoutes'))
app.use('/comments', require('./routes/commentRoutes'))
app.use('/uploads', require('./routes/uploadRoutes'))

const whitelist = ['*']

app.use((req, res, next) => {
	const origin = req.get('referer')
	const isWhitelisted = whitelist.find((w) => origin && origin.includes(w))
	if (isWhitelisted) {
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader(
			'Access-Control-Allow-Methods',
			'GET, POST, OPTIONS, PUT, PATCH, DELETE'
		)
		res.setHeader(
			'Access-Control-Allow-Headers',
			'X-Requested-With,Content-Type,Authorization'
		)
		res.setHeader('Access-Control-Allow-Credentials', false)
	}
	// Pass to next layer of middleware
	if (req.method === 'OPTIONS') res.sendStatus(200)
	else next()
})

app.all('*', (req, res) => {
	res.status(404)
	if (req.accepts('html')) {
		res.sendFile(path.join(__dirname, 'views', '404.html'))
	} else if (req.accepts('json')) {
		res.json({ message: '404 Page Not Found!' })
	} else {
		res.type('txt').send('404 Page Not Found!')
	}
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
	console.log('Connected to MongoDB')
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', (err) => {
	console.log(err)
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		'mongoErrLog.log'
	)
})
