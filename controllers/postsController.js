const Post = require('../models/post')
const User = require('../models/user')
const Comment = require('../models/comment')
const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')

// @desc Get all posts
// @route GET /posts
// @access Private
const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find().lean()
    if (!posts?.length)
        return res.status(400).json({ message: 'No posts found!'})
    res.json(posts)
})

// @desc Get posts by user id
// @route GET /posts/:userId
// @access Private
const getPostsByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params

    //Confirm data.
    if (!userId)
        return res.status(400).json({ message: 'All fields required!' })

    //Check for existing user.
    const foundUser = await User.findById(userId).exec()
    if (!foundUser)
        return res.status(400).json({ message: 'User not found!'})

    const postsByUser = await Post.find({ _id: foundUser.posts }).lean()

    res.json(postsByUser)
})

// @desc Create new post
// @route POST /posts
// @access Private
const createNewPost = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.jwt
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const authorizedUserId = decodedToken.user.id

    const { images, caption } = req.body

    //Confirm data.
    if (!images?.length)
        return res.status(400).json({ message: 'Picture(s) missing!' })

    //Check for existing user.
    const foundUser = await User.findById(authorizedUserId).exec()
    if (!foundUser)
        return res.status(409).json({ message: 'User not found!' })

    //Create and store new post.
    const postObject = { 'user': authorizedUserId, 'images': images, 'caption': caption }
    const post = await Post.create(postObject)
    if (post) {
        //Update user data.
        foundUser.posts.push(post._id)
        await foundUser.save()
        res.status(201).json({ message: 'New post created!' })
    } else
        res.status(400).json({ message: 'Missing data!' })

    
})

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.jwt
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const authorizedUserId = decodedToken.user.id

    const { 
        id, 
        images, 
        caption, 
        like, //a flag to update likes[].
        comment 
    } = req.body

    //Confirm data.
    if (!id)
        return res.status(400).json({ message: 'Post ID required!' })

    //Check if post exists.
    const post = await Post.findById(id).exec()
    if (!post)
        return res.status(400).json({ message: 'Post not found!' })

    //Update data.
    if (images)
        post.images = images

    if (caption)
        post.caption = caption

    if (like) {
        post.likes.includes(authorizedUserId) ? 
            post.likes = post.likes.filter(id => id.toString() !== authorizedUserId.toString()) :
            post.likes.push(authorizedUserId)
    }

    if (comment)
        post.comments.push(comment)
        
    const updatedPost = await post.save()
    res.json({ message: `Post ${updatedPost._id} updated!` })
})

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id)
        return res.status(400).json({ message: 'Post ID required!' })

    const post = await Post.findById(id).exec()
    if (!post)
        return res.status(400).json({ message: 'Post not found!' })
    
    const result = await post.deleteOne()
    
    await Comment.deleteMany({ _id: {$in: result.comments} })

    const user = await User.findById(result.user)
    user.posts = user.posts.filter(id => id.toString() !== result._id.toString())
    const updatedUser = user.save()

    res.json({ message: `Post ${result._id} deleted!` })
})

module.exports = {
    getAllPosts,
    getPostsByUserId,
    createNewPost,
    updatePost,
    deletePost
}