const User = require('../models/user')
const Post = require('../models/post')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length)
        return res.status(400).json({ message: 'No users found!'})
    res.json(users)
})

// @desc Search user matching regex.
// @route GET /users/:query
// @access Private
const searchUser = asyncHandler(async (req, res) => {
    const { query } = req.params

    if (!query)
        return res.status(400).json({ message: 'Query required!' })

    const searchResults = await User.find({ username: { $regex: query, $options: 'i' } }).select('-password').lean()

    res.json(searchResults)
})

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, name } = req.body

    //Confirm data.
    if (!username || !password)
        return res.status(400).json({ message: 'All fields required!' })

    //Check for duplicate.
    const duplicate = await User.findOne({ username }).lean().exec()
    if (duplicate)
        return res.status(409).json({ message: 'Duplicate username!' })

    //Hash password.
    const hashedPassword = await bcrypt.hash(password, 10) //salt rounds.

    //Create and store new user.
    const userObject = { 'username': username, 'password': hashedPassword, 'name': name }
    const user = await User.create(userObject)
    if (user)
        res.status(201).json({ message: `New user ${username} created!` })
    else
        res.status(400).json({ message: 'Invalid user data received!' })
})

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password, name, contact, bio, avatar, postIdToRemove, postIdToAdd } = req.body

    //Confirm data.
    if (!id)
        return res.status(400).json({ message: 'All fields required!' })
    
    const user = await User.findById(id).exec()
    if (!user)
        return res.status(400).json({ message: 'User not found!' })

    //Check for duplicate.
    const duplicate = await User.findOne({ username }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id) //allow updates to the original user.
        return res.status(409).json({ message: 'Duplicate username!' })

    //Update data.
    if (username)
        user.username = username
    if (password)
        user.password = await bcrypt.hash(password, 10) //salt rounds.

    if (name)
        user.name = name
    if (contact)
        user.contact = contact
    if (bio)
        user.bio = bio
    if (avatar)
        user.avatar = avatar

    if (postIdToRemove) {
        const post  = await Post.findById(postIdToRemove)
        const result = await post.deleteOne()
        user.posts = user.posts.filter(id => id.toString() !== result._id.toString())
    }
    if (postIdToAdd)
        user.posts.push(postIdToAdd)

    const updatedUser = await user.save()
    res.json({ message: `${updatedUser.username}'s data updated!` })
})

// @desc Update following and followers count
// @route PATCH /users/:id
// @access Private
const updateFollow = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id)
        return res.status(400).json({ message: 'User ID required!' })

    const user = await User.findById(id).exec()
    if (!user) 
        return res.status(400).json({ message: 'User not found!' })

    const refreshToken = req.cookies.jwt
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const userId = decodedToken.user.id
    const authorizedUser = await User.findById(userId).exec()

    if (authorizedUser.following.includes(user._id)) {
        authorizedUser.following = authorizedUser.following.filter(id => id.toString() !== user._id.toString())
        user.followers = user.followers.filter(id => id.toString() !== authorizedUser._id.toString())
    } else {
        authorizedUser.following.push(user._id)
        user.followers.push(authorizedUser._id)
    }

    const updatedAuthorizedUser = await authorizedUser.save()
    const updatedUser = await user.save()
    res.json({ message: `${updatedAuthorizedUser.username}'s following count and 
                            ${updatedUser.username}'s followers' count updated!` })
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id)
        return res.status(400).json({ message: 'User ID required!' })

    const user = await User.findById(id).exec()
    if (!user)
        return res.status(400).json({ message: 'User not found!' })

    const result = await user.deleteOne()
    res.json({ message: `Username ${result.username} with ID ${result._id} deleted!` })
})

module.exports = {
    getAllUsers,
    searchUser,
    createNewUser,
    updateUser,
    updateFollow,
    deleteUser
}