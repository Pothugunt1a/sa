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
  await User.deleteMany({});
  await Role.deleteMany({});
  await UserRole.deleteMany({});
  await Payment.deleteMany({});
});

describe('User and Role API', () => {
  it('should create a user', async () => {
    const CREATE_USER = gql`
      mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
          user_id
          Username
          email
          status
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_USER,
      variables: {
        input: {
          Username: "testuser",
          email: "unique@example.com",
          password: "password123",
          status: "active"
        }
      }
    });

    expect(res.data.createUser).toHaveProperty('user_id');
    expect(res.data.createUser.Username).toBe("testuser");
  });

  it('should create a role', async () => {
    const CREATE_ROLE = gql`
      mutation CreateRole($input: RoleInput!) {
        createRole(input: $input) {
          role_id
          role_name
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_ROLE,
      variables: {
        input: {
          role_name: "admin"
        }
      }
    });

    expect(res.data.createRole).toHaveProperty('role_id');
    expect(res.data.createRole.role_name).toBe("admin");
  });

  it('should assign a role to a user', async () => {
    const user = await User.create({
      Username: "testuser",
      email: "unique@example.com",
      password: "password123",
      status: "active"
    });

    const role = await Role.create({
      role_name: "admin"
    });

    const ASSIGN_ROLE = gql`
      mutation AssignRole($userId: ID!, $roleId: ID!) {
        assignRoleToUser(userId: $userId, roleId: $roleId) {
          user_id
          role_id
        }
      }
    `;

    const res = await server.executeOperation({
      query: ASSIGN_ROLE,
      variables: {
        userId: user.user_id,
        roleId: role.role_id
      }
    });

    expect(res.data.assignRoleToUser.user_id).toBe(user.user_id.toString());
    expect(res.data.assignRoleToUser.role_id).toBe(role.role_id.toString());
  });
});

describe('Payment API', () => {
  const testPaymentData = {
    amount: 100.50,
    email: "test@example.com",
    fullName: "Test User",
    address1: "123 Test St",
    city: "Test City",
    state: "TS",
    isEvent: false
  };

  const testDbPaymentData = {
    stripe_payment_intent_id: 'test_intent_id',
    order_id: 'TEST123',
    amount: 100.50,
    payment_method: 'card',
    payment_status: 'pending',
    email: 'test@example.com',
    full_name: 'Test User',
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    transaction_id: 'test_intent_id'
  };

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
            full_name
            address1
            city
            state
          }
          clientSecret
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_PAYMENT,
      variables: {
        input: testPaymentData
      },
    });

    expect(res.data.createPayment.success).toBe(true);
    expect(res.data.createPayment.payment.amount).toBe(100.50);
    expect(res.data.createPayment.payment.full_name).toBe(testPaymentData.fullName);
    expect(res.data.createPayment.clientSecret).toBe('test_client_secret');
  });

  it('should get a payment by ID', async () => {
    const payment = await Payment.create(testDbPaymentData);

    const GET_PAYMENT = gql`
      query GetPayment($id: ID!) {
        getPayment(id: $id) {
          _id
          order_id
          amount
          payment_status
          email
          full_name
          address1
          city
          state
        }
      }
    `;

    const res = await server.executeOperation({
      query: GET_PAYMENT,
      variables: { id: payment._id.toString() },
    });

    expect(res.data.getPayment.order_id).toBe('TEST123');
    expect(res.data.getPayment.full_name).toBe(testDbPaymentData.full_name);
  });

  it('should update payment status', async () => {
    const payment = await Payment.create(testDbPaymentData);

    const UPDATE_PAYMENT_STATUS = gql`
      mutation UpdatePaymentStatus($paymentIntentId: String!, $status: String!) {
        updatePaymentStatus(paymentIntentId: $paymentIntentId, status: $status) {
          success
          message
          payment {
            payment_status
            full_name
            address1
            city
            state
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
    await Payment.create(testDbPaymentData);

    const CONFIRM_PAYMENT = gql`
      mutation ConfirmPayment($paymentIntentId: String!) {
        confirmPayment(paymentIntentId: $paymentIntentId) {
          payment_status
          payment_date
          full_name
          address1
          city
          state
        }
      }
    `;

    const res = await server.executeOperation({
      query: CONFIRM_PAYMENT,
      variables: { paymentIntentId: 'test_intent_id' },
    });

    expect(res.data.confirmPayment.payment_status).toBe('completed');
    expect(res.data.confirmPayment.full_name).toBe(testDbPaymentData.full_name);
  });

  it('should store full name and address details', async () => {
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
            full_name
            address1
            city
            state
          }
          clientSecret
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_PAYMENT,
      variables: {
        input: testPaymentData
      },
    });

    expect(res.data.createPayment.success).toBe(true);
    expect(res.data.createPayment.payment).toMatchObject({
      full_name: testPaymentData.fullName,
      address1: testPaymentData.address1,
      city: testPaymentData.city,
      state: testPaymentData.state
    });

    // Verify in database
    const savedPayment = await Payment.findOne({ 
      stripe_payment_intent_id: 'test_intent_id' 
    });
    expect(savedPayment).toBeTruthy();
    expect(savedPayment.full_name).toBe(testPaymentData.fullName);
    expect(savedPayment.address1).toBe(testPaymentData.address1);
    expect(savedPayment.city).toBe(testPaymentData.city);
    expect(savedPayment.state).toBe(testPaymentData.state);
  });
});
