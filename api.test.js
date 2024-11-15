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
  await mongoose.connect(global.__MONGO_URI__);
  server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: () => ({ stripe: stripeMock })
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Role.deleteMany({});
  await UserRole.deleteMany({});
  await Payment.deleteMany({});
});

describe('GraphQL API', () => {
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
          email: "test@example.com",
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
      email: "unique@example.com", // Use a unique email
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

  describe('Payment Operations', () => {
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
              clientSecret
            }
          }
        }
      `;

      const res = await server.executeOperation({
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
          }
        }
      });

      expect(res.data.createPayment.success).toBe(true);
      expect(res.data.createPayment.payment).toHaveProperty('clientSecret');
      expect(res.data.createPayment.payment.amount).toBe(100.50);
    });

    it('should get all payments', async () => {
      // Create a test payment first
      const payment = new Payment({
        order_id: "TEST-123",
        amount: 100,
        payment_method: "card",
        payment_status: "pending",
        email: "test@example.com",
        full_name: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        transaction_id: "test_transaction",
        stripe_payment_intent_id: "test_intent_id",
        is_donation: true
      });
      await payment.save();

      const GET_ALL_PAYMENTS = gql`
        query GetAllPayments {
          getAllPayments {
            order_id
            amount
            payment_status
            email
          }
        }
      `;

      const res = await server.executeOperation({
        query: GET_ALL_PAYMENTS
      });

      expect(res.data.getAllPayments).toHaveLength(1);
      expect(res.data.getAllPayments[0].order_id).toBe("TEST-123");
    });

    it('should update payment status', async () => {
      // Create a test payment first
      const payment = await Payment.create({
        stripe_payment_intent_id: 'test_intent_id',
        order_id: "TEST-123",
        amount: 100,
        payment_method: "card",
        payment_status: "pending",
        email: "test@example.com",
        full_name: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        transaction_id: "test_transaction",
        is_donation: true
      });

      const UPDATE_PAYMENT_STATUS = gql`
        mutation UpdatePaymentStatus($paymentId: ID!, $status: String!) {
          updatePaymentStatus(paymentId: $paymentId, status: $status) {
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
          paymentId: payment._id.toString(),
          status: "completed"
        }
      });

      expect(res.data.updatePaymentStatus.success).toBe(true);
      expect(res.data.updatePaymentStatus.payment.payment_status).toBe("completed");
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
          email: "test@example.com"
        }
      });

      expect(res.data.createPaymentIntent).toHaveProperty('clientSecret');
      expect(res.data.createPaymentIntent.clientSecret).toBe('test_client_secret');
    });

    it('should confirm a payment', async () => {
      // Create a test payment first
      await Payment.create({
        order_id: "TEST-123",
        amount: 100,
        payment_method: "card",
        payment_status: "pending",
        email: "test@example.com",
        full_name: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        transaction_id: "test_intent_id",
        stripe_payment_intent_id: "test_intent_id",
        is_donation: true
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
        variables: {
          paymentIntentId: "test_intent_id"
        }
      });

      expect(res.data.confirmPayment.payment_status).toBe("completed");
      expect(res.data.confirmPayment.payment_date).toBeTruthy();
    });
  });
});
