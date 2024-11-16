const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const { gql } = require('graphql-tag');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');
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

beforeEach(async () => {
  await Payment.deleteMany({});
});

describe('User and Role API', () => {
  it('should create a user', async () => {
    const CREATE_USER = gql`
      mutation CreateUser($input: UserInput!) {
      variables: {
        input: {
          Username: "testuser",
          email: "unique@example.com",
          password: "password123",
          status: "active"
        }
  it('should assign a role to a user', async () => {
    const user = await User.create({
      Username: "testuser",
      email: "unique@example.com",
      password: "password123",
      status: "active"
    });
    expect(res.data.assignRoleToUser.user_id).toBe(user.user_id.toString());
    expect(res.data.assignRoleToUser.role_id).toBe(role.role_id.toString());
  });
});

describe('Payment API', () => {
  it('should create a payment', async () => {
    const CREATE_PAYMENT = gql`
      mutation CreatePayment($input: PaymentInput!) {
        createPayment(input: $input) {
          success
          message
          payment {
            order_id
            amount
            payment_method
            payment_status
            email
          }
          clientSecret
        }
      }
    `;
      query: CREATE_PAYMENT,
      variables: {
        input: {
          amount: 100.50,
          email: "test@example.com",
          fullName: "Test User",
          address1: "123 Test St",
          city: "Test City",
          state: "TS",
          isEvent: false
        },
      },
    });
    expect(res.data.createPayment.success).toBe(true);
    expect(res.data.createPayment.payment.amount).toBe(100.50);
    expect(res.data.createPayment.clientSecret).toBe('test_client_secret');
  });
  it('should get a payment by ID', async () => {
    const payment = await Payment.create({
      stripe_payment_intent_id: 'test_intent_id',
      order_id: 'TEST123',
      amount: 100.50,
      payment_method: 'card',
      payment_status: 'pending',
      email: 'test@example.com',
      full_name: 'Test User'
    });
    const GET_PAYMENT = gql`
      query GetPayment($id: ID!) {
        getPayment(id: $id) {
          _id
          order_id
          amount
          payment_status
          email
        }
      }
    `;
    const res = await server.executeOperation({
      query: GET_PAYMENT,
      variables: { id: payment._id.toString() },
    });
    expect(res.data.getPayment.order_id).toBe('TEST123');
    expect(res.data.getPayment.amount).toBe(100.50);
  });
  it('should update payment status', async () => {
    const payment = await Payment.create({
      stripe_payment_intent_id: 'test_intent_id',
      order_id: 'TEST123',
      amount: 100.50,
      payment_method: 'card',
      payment_status: 'pending',
      email: 'test@example.com',
      full_name: 'Test User'
    });
    const UPDATE_PAYMENT_STATUS = gql`
      mutation UpdatePaymentStatus($paymentIntentId: String!, $status: String!) {
        updatePaymentStatus(paymentIntentId: $paymentIntentId, status: $status) {
          success
          message
          payment {
            payment_status
          }
        }
      }
    `;
    const res = await server.executeOperation({
      query: UPDATE_PAYMENT_STATUS,
      variables: { 
        paymentIntentId: 'test_intent_id',
        status: 'completed'
      },
    });
    expect(res.data.updatePaymentStatus.success).toBe(true);
    expect(res.data.updatePaymentStatus.payment.payment_status).toBe('completed');
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
      variables: { 
        amount: 10000,
        email: 'test@example.com'
      },
    });


    expect(res.data.createPaymentIntent.clientSecret).toBe('test_client_secret');
  });
  it('should confirm a payment', async () => {
    await Payment.create({
      stripe_payment_intent_id: 'test_intent_id',
      order_id: 'TEST123',
      amount: 100.50,
      payment_method: 'card',
      payment_status: 'pending',
      email: 'test@example.com',
      full_name: 'Test User'
    });
    const CONFIRM_PAYMENT = gql`
      mutation ConfirmPayment($paymentIntentId: String!) {
        confirmPayment(paymentIntentId: $paymentIntentId) {
          payment_status
          payment_date
        }
      }
    `;
    const res = await server.executeOperation({
      query: CONFIRM_PAYMENT,
      variables: { paymentIntentId: 'test_intent_id' },
    });

    expect(res.data.confirmPayment.payment_status).toBe('completed');
    expect(res.data.confirmPayment.payment_date).toBeTruthy();
  });
});
