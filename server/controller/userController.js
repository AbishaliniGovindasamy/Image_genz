import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import razorpay from 'razorpay';
import transactionModel from "../models/transactionModel.js";

// Razorpay instance
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Use Credits
const useCredits = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Payment Razorpay
const paymentRazorpay = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user || !planId) return res.json({ success: false, message: 'Missing Details' });

    let credits, amount;
    switch (planId) {
      case 'Basic': credits = 100; amount = 10; break;
      case 'Advanced': credits = 500; amount = 50; break;
      case 'Business': credits = 5000; amount = 250; break;
      default: return res.json({ success: false, message: 'Plan not found' });
    }

    const transaction = await transactionModel.create({
      userId, plan: planId, credits, amount, date: Date.now()
    });

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY || "INR",
      receipt: transaction._id.toString()
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) return res.json({ success: false, message: error.message });
      res.json({ success: true, order });
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Verify Razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    if (!razorpay_payment_id) {
      return res.json({ success: false, message: 'Payment failed or not completed' });
    }

    const order = await razorpayInstance.orders.fetch(razorpay_order_id);
    const transaction = await transactionModel.findById(order.receipt);
    if (!transaction) return res.json({ success: false, message: 'Transaction not found' });
    if (transaction.payment) return res.json({ success: false, message: 'Payment already processed' });

    const user = await userModel.findById(transaction.userId);
const newCredits = Number(user.creditBalance || 0) + Number(transaction.credits);

    await userModel.findByIdAndUpdate(user._id, { creditBalance: newCredits });
    await transactionModel.findByIdAndUpdate(transaction._id, { payment: true });

    res.json({ success: true, message: 'Credits added' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  useCredits,
  paymentRazorpay,
  verifyRazorpay
};
