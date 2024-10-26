require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
//const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Stripe = require('stripe');

// Check if the STRIPE_SECRET_KEY is set
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function startServer() {
  const app = express();
  
  // Make sure this line is present and comes before your routes
  app.use(express.json());

  // CORS configuration
  app.use(cors({
    origin: 'https://shashikala-foundation.netlify.app',
    credentials: true
  }));

  await connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ 
      req,
      stripe
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  // Add a route for creating payment intents
  app.post('/create-payment-intent', async (req, res) => {
    try {
      console.log('Received request:', req.body);
      
      if (!req.body || !req.body.amount || !req.body.email) {
        return res.status(400).json({ error: 'Missing required fields in request body' });
      }

      const { amount, email } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        receipt_email: email,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
});
