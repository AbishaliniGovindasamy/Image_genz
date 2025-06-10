import express from 'express';
import {
  registerUser,
  loginUser,
  useCredits,
  paymentRazorpay,
  verifyRazorpay
} from '../controller/userController.js';
import userAuth from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/credits', userAuth, useCredits);
userRouter.post('/payment-razorpay', userAuth, paymentRazorpay); // ✅ Add this
userRouter.post('/verify-razorpay', verifyRazorpay);

export default userRouter;
