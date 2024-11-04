require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
const Stripe = require('stripe');
const Payment = require('./app/models/Payment');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function startServer() {
  const app = express();
  
  app.use(express.json());

  app.use(cors({
    origin: [
      'https://shashikala-foundation.netlify.app',
      'http://localhost:3000',
      'https://studio.apollographql.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  await connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ 
      req,
      stripe
    }),
    introspection: true,
    playground: true
  });

  await server.start();
  
  server.applyMiddleware({ 
    app,
    path: '/graphql',
    cors: false
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/create-payment-intent', async (req, res) => {
    try {
      console.log('Received request:', req.body);
      
      if (!req.body || !req.body.amount || !req.body.email) {
        console.log('Missing required fields:', req.body);
        return res.status(400).json({ error: 'Missing required fields in request body' });
      }

      const { amount, email, fullName, address1, address2, city, state, isEvent, eventDetails } = req.body;

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        receipt_email: email,
        metadata: {
          full_name: fullName,
          address1,
          address2,
          city,
          state,
          is_event: isEvent ? 'true' : 'false',
          event_name: eventDetails?.eventName,
          event_date: eventDetails?.eventDate,
          event_venue: eventDetails?.eventVenue,
          event_time: eventDetails?.eventTime
        }
      });

      // Create MongoDB payment record
      const payment = new Payment({
        order_id: paymentIntent.id,
        amount: amount / 100, // Convert back to dollars
        payment_method: 'card',
        payment_status: 'pending',
        transaction_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id,
        email,
        full_name: fullName,
        address1,
        address2,
        city,
        state,
        is_donation: !isEvent,
        event_name: eventDetails?.eventName,
        event_date: eventDetails?.eventDate,
        event_venue: eventDetails?.eventVenue,
        event_time: eventDetails?.eventTime
      });

      await payment.save();
      console.log('Payment saved to MongoDB:', payment);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.payment_id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add endpoint to update payment status after successful confirmation
  app.post('/update-payment-status', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      const payment = await Payment.findOneAndUpdate(
        { stripe_payment_intent_id: paymentIntentId },
        { 
          payment_status: 'completed',
          payment_date: new Date()
        },
        { new: true }
      );

      if (!payment) {
        throw new Error('Payment record not found');
      }

      console.log('Payment status updated in MongoDB:', payment);
      res.json({ success: true, payment });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`
      🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}
      ⭐️ Health check at http://localhost:${PORT}/health
    `);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
});
