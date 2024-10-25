require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const connectDB = require('./db');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function startServer() {
  const app = express();
  
  // Update CORS configuration
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
