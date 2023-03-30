const express = require('express')
const router = express.Router()
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

const isImage = (req, file, callback) => {
	if (file.mimetype.startsWith('image')) callback(null, true)
	else callback(null, Error('Only images allowed!'))
}

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, callback) => {
			const dir = path.join(__dirname, '..', 'public', 'uploads', req.body.userId)

			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

			callback(null, dir)
		},
		filename: (req, file, callback) => {
			callback(null, `${Date.now()}-${file.originalname}`)
		}
	}),
	fileFilter: isImage
})

router.route('/').post(upload.array('images', 10), (req, res) => {
	try {
		let filename = []
		req.files.forEach((file) => filename.push(`${req.body.userId}/${file.filename}`))
		res.json({ filenames: filename })
	} catch (err) {
		console.log(err.message)
	}
})

module.exports = router
