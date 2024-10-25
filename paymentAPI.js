const express = require('express');
const router = express.Router();
const Payment = require('./models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a new payment
router.post('/create', async (req, res) => {
  try {
    const { order_id, amount, payment_method } = req.body;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency: 'usd',
      payment_method_types: [payment_method],
    });

    // Create a new payment record in the database
    const payment = new Payment({
      order_id,
      amount,
      payment_method,
      payment_status: 'pending',
      transaction_id: paymentIntent.id,
    });

    await payment.save();

    res.status(201).json({ 
      message: 'Payment created successfully', 
      payment: payment,
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating payment', error: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching payment', error: error.message });
  }
});

// Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { payment_status: status },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating payment status', error: error.message });
  }
});

module.exports = router;
