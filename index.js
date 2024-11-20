require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
const Stripe = require('stripe');
const Payment = require('./models/Payment');
const mongoose = require('mongoose');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function startServer() {
  try {
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
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      exposedHeaders: ['Content-Length', 'X-Requested-With']
    }));

    console.log('Initializing MongoDB connection...');
    const dbConnection = await connectDB();
    console.log('MongoDB connection established');

    app.get('/test-db', async (req, res) => {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json({
          status: 'ok',
          connected: mongoose.connection.readyState === 1,
          collections: collections.map(c => c.name)
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });

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

    app.post('/api/event-registration', async (req, res) => {
      try {
        console.log('Received event registration request:', req.body);

        // Add CORS headers explicitly for this endpoint
        res.header('Access-Control-Allow-Origin', 'https://shashikala-foundation.netlify.app');
        res.header('Access-Control-Allow-Credentials', true);

        // Extract data from the form submission
        const registrationData = {
          event_id: parseInt(req.body.eventId || 1),
          eventName: req.body.eventName,
          eventDate: req.body.eventDate,
          eventVenue: req.body.eventVenue,
          eventTime: req.body.eventTime,
          firstName: req.body.firstName,
          middleName: req.body.middleName,
          lastName: req.body.lastName,
          email: req.body.email,
          contact: req.body.contact,
          address1: req.body.address1,
          address2: req.body.address2,
          city: req.body.city,
          state: req.body.state,
          zipcode: req.body.zipcode,
          paymentAmount: parseFloat(req.body.paymentAmount || 0)
        };

        console.log('Formatted registration data:', registrationData);

        // Create the registration using the resolver
        const result = await resolvers.Mutation.registerForEvent(null, {
          input: registrationData
        }, { stripe });

        if (!result.success) {
          throw new Error(result.message);
        }

        console.log('Registration created:', result.registration);

        // Return appropriate response based on payment requirement
        if (registrationData.paymentAmount > 0) {
          res.json({
            success: true,
            registration: result.registration,
            paymentIntent: result.paymentIntent
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
          message: error.message || 'Failed to process registration'
        });
      }
    });

    app.post('/test-registration', async (req, res) => {
      try {
        const testData = {
          event_id: 1,
          eventName: "Diwali Art Festival 2024",
          eventDate: "October 25, 2024",
          eventVenue: "Atlanta, GA",
          eventTime: "7:00 PM EST",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          contact: "1234567890",
          address1: "123 Test St",
          city: "Atlanta",
          state: "GA",
          zipcode: "30303",
          paymentAmount: 20
        };

        const result = await resolvers.Mutation.createEventRegistration(null, {
          input: testData
        });

        console.log('Test registration result:', result);

        res.json({
          success: true,
          message: 'Test registration created',
          data: result
        });
      } catch (error) {
        console.error('Test registration failed:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`
        🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}
        ⭐️ Health check at http://localhost:${PORT}/health
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
});
