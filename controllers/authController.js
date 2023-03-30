const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
	const { username, password } = req.body

	if (!username || !password) return res.status(400).json({ message: 'All fields required!' })

	const foundUser = await User.findOne({ username }).exec()
	if (!foundUser) return res.status(401).json({ message: 'Unauthorized!' })

	const match = await bcrypt.compare(password, foundUser.password)
	if (!match) return res.status(401).json({ message: 'Unauthorized!' })

	const accessToken = jwt.sign(
		{
			user: {
				id: foundUser._id,
				username: foundUser.username
			}
		},
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: '2h' }
	)

	const refreshToken = jwt.sign(
		{
			user: {
				id: foundUser._id,
				username: foundUser.username
			}
		},
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: '30d' }
	)

	//Create secure cookie with refresh token.
	res.cookie('jwt', refreshToken, {
		httpOnly: true, //accessible by web server only.
		secure: true, //https.
		sameSite: 'None', //cross-site cookie.
		maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expiry.
	})

	res.json({ accessToken })
})

// @desc Logout
// @route POST /auth/logout
// @access Public
const logout = (req, res) => {
	const cookies = req.cookies

	if (!cookies?.jwt) return res.sendStatus(204) //no content.

	res.clearCookie('jwt', {
		httpOnly: true,
		secure: true,
		sameSite: 'None'
	})

	res.json({ message: 'Cookie cleared!' })
}

// @desc Refresh
// @route POST /auth/refresh
// @access Public
const refresh = (req, res) => {
	const cookies = req.cookies

	if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized!' })

	const refreshToken = cookies.jwt

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		asyncHandler(async (err, decoded) => {
			if (err) return res.status(403).json({ message: 'Forbidden!' })

			const foundUser = await User.findById(decoded.user.id).exec()

			if (!foundUser) return res.status(401).json({ message: 'Unauthorized user!' })

			const accessToken = jwt.sign(
				{
					user: {
						id: foundUser._id,
						username: foundUser.username
					}
				},
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '2h' }
			)

			res.json({ accessToken })
		})
	)
}

module.exports = {
	login,
	logout,
	refresh
}
