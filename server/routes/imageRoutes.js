import express from 'express'

import  generateImage from '../controller/imageController.js'
import userAuth from '../middleware/auth.js'


const imageRouter = express.Router()

imageRouter.post('/generate-image',userAuth, generateImage)

export default imageRouter