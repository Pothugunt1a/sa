const mongoose = require('mongoose');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('graphql-tag');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const Payment = require('./models/Payment');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'test_intent_id',
        client_secret: 'test_client_secret',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'test_intent_id',
        amount: 10000,
        currency: 'usd',
        payment_method_types: ['card'],
        status: 'succeeded',
        receipt_email: 'test@example.com',
      }),
    },
  }));
});

const stripeMock = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'test_intent_id',
      client_secret: 'test_client_secret',
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'test_intent_id',
      amount: 10000,
      currency: 'usd',
      payment_method_types: ['card'],
      status: 'succeeded',
      receipt_email: 'test@example.com',
    }),
  },
};

describe('Payment API', () => {
  let server;

  beforeAll(async () => {
    server = new ApolloServer({ 
      typeDefs, 
      resolvers,
      context: () => ({ stripe: stripeMock })
    });
    await server.start();

    await mongoose.connect(global.__MONGO_URI__);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await server.stop();
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  it('should create a payment', async () => {
    const CREATE_PAYMENT = gql`
      mutation CreatePayment($input: PaymentInput!) {
        createPayment(input: $input) {
          order_id
          amount
          payment_method
          payment_status
          transaction_id
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_PAYMENT,
      variables: {
        input: {
          order_id: '12345',
          amount: 100,
          payment_method: 'card',
          email: 'test@example.com',
        },
      },
    });

    expect(res.data.createPayment).toMatchObject({
      order_id: '12345',
      amount: 100,
      payment_method: 'card',
      payment_status: 'pending',
      transaction_id: 'test_intent_id',
    });
  });

  it('should get a payment by ID', async () => {
    const payment = await Payment.create({
      order_id: '12345',
      amount: 100,
      payment_method: 'card',
      payment_status: 'pending',
      transaction_id: 'test_transaction_id',
      email: 'test@example.com',
      stripe_payment_intent_id: 'test_intent_id'
    });

    console.log('Created payment:', payment); // Add this line for debugging

    const GET_PAYMENT = gql`
      query GetPayment($id: ID!) {
        getPayment(id: $id) {
          payment_id
          order_id
          amount
          payment_method
          payment_status
          transaction_id
        }
      }
    `;

    const res = await server.executeOperation({
      query: GET_PAYMENT,
      variables: { id: payment.payment_id.toString() },
    });

    console.log('Query result:', res); // Add this line for debugging

    expect(res.data.getPayment).not.toBeNull();
    expect(res.data.getPayment).toMatchObject({
      payment_id: payment.payment_id.toString(),
      order_id: '12345',
      amount: 100,
      payment_method: 'card',
      payment_status: 'pending',
      transaction_id: 'test_transaction_id',
    });
  });

  it('should update payment status', async () => {
    const payment = await Payment.create({
      order_id: '12345',
      amount: 100,
      payment_method: 'card',
      payment_status: 'pending',
      transaction_id: 'test_transaction_id',
      email: 'test@example.com',
      stripe_payment_intent_id: 'test_intent_id' // Add this line
    });

    const UPDATE_PAYMENT_STATUS = gql`
      mutation UpdatePaymentStatus($id: ID!, $status: String!) {
        updatePaymentStatus(id: $id, status: $status) {
          order_id
          payment_status
        }
      }
    `;

    const res = await server.executeOperation({
      query: UPDATE_PAYMENT_STATUS,
      variables: { id: payment.payment_id.toString(), status: 'completed' },
    });

    expect(res.data.updatePaymentStatus).toMatchObject({
      order_id: '12345',
      payment_status: 'completed',
    });
  });

  it('should create a payment intent', async () => {
    const CREATE_PAYMENT_INTENT = gql`
      mutation CreatePaymentIntent($amount: Int!, $email: String!) {
        createPaymentIntent(amount: $amount, email: $email) {
          clientSecret
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_PAYMENT_INTENT,
      variables: { amount: 10000, email: 'test@example.com' },
    });

    expect(res.data.createPaymentIntent).toHaveProperty('clientSecret');
    expect(typeof res.data.createPaymentIntent.clientSecret).toBe('string');
  });

  it('should confirm a payment', async () => {
    const CONFIRM_PAYMENT = gql`
      mutation ConfirmPayment($paymentIntentId: String!) {
        confirmPayment(paymentIntentId: $paymentIntentId) {
          order_id
          amount
          payment_method
          payment_status
          transaction_id
          email
        }
      }
    `;

    const res = await server.executeOperation({
      query: CONFIRM_PAYMENT,
      variables: { paymentIntentId: 'test_intent_id' },
    });

    expect(res.data.confirmPayment).toMatchObject({
      order_id: 'test_intent_id',
      amount: 100,
      payment_method: 'card',
      payment_status: 'completed',
      transaction_id: 'test_intent_id',
      email: 'test@example.com',
    });
  });
});
