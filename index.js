require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
const Stripe = require('stripe');

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

      const { amount, email } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        receipt_email: email,
      });

      console.log('Created payment intent:', paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
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
