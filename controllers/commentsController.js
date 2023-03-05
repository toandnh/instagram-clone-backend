const Comment = require('../models/comment')
const Post = require('../models/post')
const asyncHandler = require('express-async-handler')

// @desc Get all comments
// @route GET /comments
// @access Private
const getComments = asyncHandler(async (req, res) => {
    const comments = await Comment.find().lean()
    if (!comments?.length)
        return res.status(400).json({ message: 'No comments found!'})
    res.json(comments)
})

// @desc Get comments by post id
// @route GET /comments/:postId
// @access Private
const getCommentsByPostId = asyncHandler(async (req, res) => {
    const { postId } = req.params

    //Confirm data.
    if (!postId)
        return res.status(400).json({ message: 'All fields required!' })

    //Check for existing post.
    const foundPost = await Post.findById(postId).exec()
    if (!foundPost) 
        return res.status(400).json({ message: 'Post not found!' })

    const commentsByPost = await Comment.find({ _id: foundPost.comments }).lean()

    res.json(commentsByPost)
})

// @desc Create new comment
// @route POST /comments
// @access Private
const createNewComment = asyncHandler(async (req, res) => {
    const { user, text } = req.body

    //Confirm data.
    if (!user || !text)
        return res.status(400).json({ message: 'All fields required!' })

    //Create and store new comment.
    const commentObject = { 'user': user, 'text': text }
    const comment = await Comment.create(commentObject)
    
    if (comment) {
        res.json({ commentId: comment._id })
    } else
        res.status(400).json({ message: 'Missing data!' })
})

// @desc Update a comment
// @route PATCH /comments
// @access Private
const updateComment = asyncHandler(async (req, res) => {
    const { id, text } = req.body

    //Confirm data.
    if (!id)
        return res.status(400).json({ message: 'All fields required!' })

    const comment = await Comment.findById(id).exec()
    if (!comment)
        return res.status(400).json({ message: 'Comment not found!' })

    //Update data.
    if (text)
        comment.text = text

    const updatedComment = await comment.save()
    res.json({ message: `Comment ${updatedComment._id} updated!` })
})

// @desc Delete a comment
// @route DELETE /comments
// @access Private
const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id)
        return res.status(400).json({ message: 'Comment ID required!' })

    const comment = await Comment.findById(id).exec()
    if (!comment)
        return res.status(400).json({ message: 'Comment not found!' })

    const result = await comment.deleteOne()
    res.json({ message: `Comment ${result._id} deleted!` })
})

module.exports = {
    getComments,
    getCommentsByPostId,
    createNewComment,
    updateComment,
    deleteComment
}