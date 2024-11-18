require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
const Stripe = require('stripe');
const Payment = require('./models/Payment');

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
      console.log('Received payment request:', req.body);

      const { 
        amount, 
        email, 
        fullName, 
        address1, 
        address2, 
        city, 
        state,
        isEvent,
        eventDetails 
      } = req.body;

      const result = await resolvers.Mutation.createPayment(
        null,
        {
          input: {
            amount: amount / 100,
            email,
            fullName,
            address1,
            address2,
            city,
            state,
            isEvent,
            eventDetails
          }
        },
        { stripe }
      );

      res.json({ 
        clientSecret: result.clientSecret,
        paymentId: result.payment._id
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/payment-confirmation', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      // Update payment status in MongoDB
      const result = await resolvers.Mutation.updatePaymentStatus(
        null,
        { 
          paymentIntentId,
          status: 'completed'
        },
        { stripe }
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to update payment status');
      }
      console.log('Payment status updated:', result.payment);
      res.json({ success: true, payment: result.payment });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/event-registration', async (req, res) => {
    try {
      console.log('Received event registration request:', req.body);

      const result = await resolvers.Mutation.createEventRegistration(
        null,
        { input: req.body },
        { req }
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('Event registration created:', result.registration);

      // If it's a paid event, create a payment intent
      if (result.registration.payment_amount > 0) {
        const paymentResult = await resolvers.Mutation.createPayment(
          null,
          {
            input: {
              amount: result.registration.payment_amount,
              email: result.registration.email,
              fullName: `${result.registration.first_name} ${result.registration.last_name}`,
              address1: result.registration.address1,
              address2: result.registration.address2,
              city: result.registration.city,
              state: result.registration.state,
              isEvent: true,
              eventDetails: {
                eventName: result.registration.event_name,
                eventDate: result.registration.event_date,
                eventVenue: result.registration.event_venue,
                eventTime: result.registration.event_time
              }
            }
          },
          { stripe }
        );

        res.json({
          success: true,
          registration: result.registration,
          payment: paymentResult.payment,
          clientSecret: paymentResult.clientSecret
        });
      } else {
        res.json({
          success: true,
          registration: result.registration
        });
      }
    } catch (error) {
      console.error('Error processing event registration:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
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
