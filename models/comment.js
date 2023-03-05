const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            require: true,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        }
    },
    {timestamps: true}
)

module.exports = mongoose.model('Comment', commentSchema)