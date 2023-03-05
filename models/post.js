const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            require: true,
            ref: 'User'
        },
        images: [{
            type: String,
            require: true
        }],
        caption: {
            type: String
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }]
    },
    {timestamps: true}
)

module.exports = mongoose.model('Post', postSchema)