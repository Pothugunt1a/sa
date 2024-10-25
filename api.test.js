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
          email: "unique@example.com", // Use a unique email
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

  it('should create a payment', async () => {
    const CREATE_PAYMENT = gql`
      mutation CreatePayment($input: PaymentInput!) {
        createPayment(input: $input) {
          order_id
          amount
          payment_method
          payment_status
          email
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_PAYMENT,
      variables: {
        input: {
          order_id: "ORDER123",
          amount: 100.50,
          payment_method: "credit_card",
          email: "unique@example.com"
        }
      }
    });

    if (res.errors) {
      console.error('GraphQL errors:', res.errors);
    }

    expect(res.data.createPayment).toHaveProperty('order_id');
    expect(res.data.createPayment.order_id).toBe("ORDER123");
    expect(res.data.createPayment.amount).toBe(100.50);
    expect(res.data.createPayment.payment_status).toBe("pending");
    expect(res.data.createPayment.email).toBe("unique@example.com");
  });
});
