const express = require('express')
const router = express.Router()
const commentsController = require('../controllers/commentsController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router
	.route('/') //
	.get(commentsController.getComments)
	.post(commentsController.createNewComment)
	.patch(commentsController.updateComment)
	.delete(commentsController.deleteComment)

router
	.route('/:postId') //
	.get(commentsController.getCommentsByPostId)

module.exports = router
