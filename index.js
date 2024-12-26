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
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'apollo-require-preflight',
        'x-apollo-operation-name',
        'apollo-client-name',
        'apollo-client-version',
        'Access-Control-Allow-Origin'
      ]
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

    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    app.options('/graphql', cors());

    app.use('/graphql', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      try {
        // Check if Authorization header exists and is properly formatted
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log('Setting default authorization header');
          // Make sure to include 'Bearer ' prefix
          req.headers.authorization = `Bearer ${process.env.API_TOKEN}`;
        }
        next();
      } catch (error) {
        console.error('Error in authorization middleware:', error);
        next(error);
      }
    });

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({ req }) => {
        try {
          // List of operations that don't require authentication
          const publicOperations = [
            'artistLogin',
            'artistSignup',
            'requestPasswordReset',
            'resetPassword',
            'verifyEmail'
          ];

          // Check if this is a public operation
          const operationName = req.body.operationName;
          if (publicOperations.includes(operationName)) {
            return { isPublicOperation: true };
          }

          // For all other operations, require authentication
          const token = req.headers.authorization || '';
          console.log('Received Authorization header:', token);

          if (!token || !token.startsWith('Bearer ')) {
            console.log('Missing or invalid Authorization header format');
            throw new Error('Authorization header must be provided and start with Bearer');
          }

          const actualToken = token.split('Bearer ')[1];
          console.log('Extracted token:', actualToken);

          if (actualToken !== process.env.API_TOKEN) {
            console.log('Token mismatch');
            throw new Error('Invalid token');
          }

          console.log('Authentication successful');
          return { token: actualToken };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
      introspection: true,
      playground: {
        settings: {
          'request.credentials': 'include',
          'request.headers': {
            'Authorization': `Bearer ${process.env.API_TOKEN}`
          }
        }
      }
    });

    await server.start();

    server.applyMiddleware({ 
      app,
      path: '/graphql',
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
      }
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

        // Create the registration
        const result = await resolvers.Mutation.registerForEvent(null, {
          input: {
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
          }
        }, { stripe });

        if (!result.success) {
          throw new Error(result.message);
        }

        console.log('Registration created:', result.registration);

        // For paid events, create payment intent
        if (result.registration.payment_amount > 0) {
          const paymentResult = await resolvers.Mutation.createPayment(null, {
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
              },
              registrationId: result.registration.registration_id
            }
          }, { stripe });

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
