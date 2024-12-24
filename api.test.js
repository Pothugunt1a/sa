const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const { gql } = require('graphql-tag');
const typeDefs = require('./app/schema');
const resolvers = require('./app/resolvers');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');
const Payment = require('./models/Payment');
const EventRegistration = require('./models/EventRegistration');
const Artist = require('./models/Artist');

process.env.JWT_SECRET = 'test_secret_key';

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

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

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
  
  // Connect to test database
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  if (server) {
    await server.stop();
  }
});

beforeEach(async () => {
  await Payment.deleteMany({});
  await EventRegistration.deleteMany({});
  await Artist.deleteMany({});
});

describe('Payment API', () => {
  it('should create a payment', async () => {
    const CREATE_PAYMENT = `
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
    expect(res.data.createPayment.payment.amount).toBe(100.50);
  });

  it('should get a payment by ID', async () => {
    const payment = await Payment.create({
      stripe_payment_intent_id: 'test_intent_id',
      order_id: 'TEST123',
      amount: 100.50,
      payment_method: 'card',
      payment_status: 'pending',
      email: 'test@example.com',
      full_name: 'Test User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS'
    });

    console.log('Created test payment:', payment);

    const GET_PAYMENT = `
      query GetPayment($id: ID!) {
        getPayment(id: $id) {
          order_id
          amount
          payment_status
          email
          stripe_payment_intent_id
        }
      }
    `;

    const res = await server.executeOperation({
      query: GET_PAYMENT,
      variables: { id: payment._id.toString() }
    });

    console.log('GraphQL response:', res);

    if (res.errors) {
      console.error('GraphQL errors:', res.errors);
    }

    expect(res.data.getPayment).toBeTruthy();
    expect(res.data.getPayment.order_id).toBe('TEST123');
    expect(res.data.getPayment.amount).toBe(100.50);
  });

  it('should update payment status', async () => {
    // Create a payment first
    const payment = await Payment.create({
      stripe_payment_intent_id: 'test_intent_id',
      order_id: 'TEST123',
      amount: 100.50,
      payment_method: 'card',
      payment_status: 'pending',
      email: 'test@example.com',
      full_name: 'Test User'
    });

    const UPDATE_PAYMENT_STATUS = `
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

    // Add this line to ensure the payment was created successfully
    console.log('Created payment ID:', payment._id.toString());

    const res = await server.executeOperation({
      query: UPDATE_PAYMENT_STATUS,
      variables: { 
        paymentId: payment.payment_id || payment._id.toString(),
        status: 'completed'
      }
    });

    // Add better error handling
    if (res.errors) {
      console.error('Full response:', res);
      throw new Error(`GraphQL Error: ${res.errors[0].message}`);
    }

    expect(res.data.updatePaymentStatus).toBeTruthy();
    expect(res.data.updatePaymentStatus.success).toBe(true);
    expect(res.data.updatePaymentStatus.payment.payment_status).toBe('completed');
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

    const CONFIRM_PAYMENT = `
      mutation ConfirmPayment($paymentIntentId: String!) {
        confirmPayment(paymentIntentId: $paymentIntentId) {
          payment_status
          payment_date
        }
      }
    `;

    const res = await server.executeOperation({
      query: CONFIRM_PAYMENT,
      variables: { paymentIntentId: 'test_intent_id' }
    });

    expect(res.data.confirmPayment.payment_status).toBe('completed');
    expect(res.data.confirmPayment.payment_date).toBeTruthy();
  });
});

describe('Event Registration API', () => {
  it('should create an event registration', async () => {
    const CREATE_REGISTRATION = `
      mutation CreateEventRegistration($input: EventRegistrationInput!) {
        createEventRegistration(input: $input) {
          success
          message
          registration {
            registration_id
            event_name
            first_name
            email
            payment_status
          }
        }
      }
    `;

    const res = await server.executeOperation({
      query: CREATE_REGISTRATION,
      variables: {
        input: {
          event_id: 1,
          eventName: "Test Event",
          eventDate: "2024-10-25",
          eventVenue: "Test Venue",
          eventTime: "7:00 PM",
          firstName: "John",
          lastName: "Doe",
          email: "test@example.com",
          contact: "+1234567890",
          address1: "123 Test St",
          city: "Test City",
          state: "TS",
          zipcode: "12345",
          paymentAmount: 20.0
        }
      }
    });

    expect(res.data.createEventRegistration.success).toBe(true);
    expect(res.data.createEventRegistration.registration.event_name).toBe("Test Event");
  });

  it('should get a registration by ID', async () => {
    const registration = await EventRegistration.create({
      event_id: 1,
      event_name: "Test Event",
      event_date: "2024-10-25",
      event_venue: "Test Venue",
      event_time: "7:00 PM",
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      contact: "+1234567890",
      address1: "123 Test St",
      city: "Test City",
      state: "TS",
      zipcode: "12345"
    });

    const GET_REGISTRATION = `
      query GetEventRegistration($id: ID!) {
        getEventRegistration(id: $id) {
          registration_id
          event_name
          email
        }
      }
    `;

    const res = await server.executeOperation({
      query: GET_REGISTRATION,
      variables: { id: registration.registration_id }
    });

    expect(res.data.getEventRegistration.event_name).toBe("Test Event");
  });
});

describe('Artist Authentication', () => {
  const testArtist = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    password: 'test123',
    phoneNumber: '1234567890',
    city: 'Test City',
    state: 'TS',
    country: 'Test Country'
  };

  beforeEach(async () => {
    // Clear the artists collection before each test
    await Artist.deleteMany({});
    
    // Reset the auto-increment counter
    const { db } = mongoose.connection;
    await db.collection('artistcounters').deleteMany({});
  });

  it('should register a new artist', async () => {
    const SIGNUP_MUTATION = `
      mutation ArtistSignup($input: ArtistSignupInput!) {
        artistSignup(input: $input) {
          success
          message
          artist {
            email
            firstName
            lastName
            artist_id
          }
        }
      }
    `;

    const res = await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { input: testArtist }
    });

    expect(res.data.artistSignup.success).toBe(true);
    expect(res.data.artistSignup.artist.email).toBe(testArtist.email);
    expect(res.data.artistSignup.artist.artist_id).toBeDefined();
  });

  it('should not register artist with existing email', async () => {
    await Artist.create(testArtist);

    const SIGNUP_MUTATION = `
      mutation ArtistSignup($input: ArtistSignupInput!) {
        artistSignup(input: $input) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { input: testArtist }
    });

    expect(res.data.artistSignup.success).toBe(false);
    expect(res.data.artistSignup.message).toContain('already registered');
  });

  it('should login artist with correct credentials', async () => {
    const artist = new Artist({
      ...testArtist,
      isVerified: true
    });
    await artist.save();

    const LOGIN_MUTATION = `
      mutation ArtistLogin($email: String!, $password: String!) {
        artistLogin(email: $email, password: $password) {
          success
          message
          token
          artist {
            email
          }
        }
      }
    `;

    const res = await server.executeOperation({
      query: LOGIN_MUTATION,
      variables: { 
        email: testArtist.email,
        password: testArtist.password
      }
    });

    expect(res.data.artistLogin.success).toBe(true);
    expect(res.data.artistLogin.token).toBeTruthy();
  });

  it('should not login unverified artist', async () => {
    await Artist.create(testArtist);

    const LOGIN_MUTATION = `
      mutation ArtistLogin($email: String!, $password: String!) {
        artistLogin(email: $email, password: $password) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: LOGIN_MUTATION,
      variables: { 
        email: testArtist.email,
        password: testArtist.password
      }
    });

    expect(res.data.artistLogin.success).toBe(false);
    expect(res.data.artistLogin.message).toContain('verify your email');
  });

  it('should handle password reset request', async () => {
    await Artist.create(testArtist);

    const RESET_REQUEST_MUTATION = `
      mutation RequestPasswordReset($email: String!) {
        requestPasswordReset(email: $email) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: RESET_REQUEST_MUTATION,
      variables: { email: testArtist.email }
    });

    expect(res.data.requestPasswordReset.success).toBe(true);
  });

  it('should verify email with valid token', async () => {
    const verificationToken = 'test-token';
    await Artist.create({
      ...testArtist,
      verificationToken
    });

    const VERIFY_EMAIL_MUTATION = `
      mutation VerifyEmail($token: String!) {
        verifyEmail(token: $token) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: VERIFY_EMAIL_MUTATION,
      variables: { token: verificationToken }
    });

    expect(res.data.verifyEmail.success).toBe(true);
  });

  it('should handle invalid login credentials', async () => {
    const artist = new Artist({
      ...testArtist,
      isVerified: true
    });
    await artist.save();

    const LOGIN_MUTATION = `
      mutation ArtistLogin($email: String!, $password: String!) {
        artistLogin(email: $email, password: $password) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: LOGIN_MUTATION,
      variables: { 
        email: testArtist.email,
        password: 'wrongpassword'
      }
    });

    expect(res.data.artistLogin.success).toBe(false);
    expect(res.data.artistLogin.message).toContain('Invalid password');
  });

  it('should handle non-existent email for password reset', async () => {
    const RESET_REQUEST_MUTATION = `
      mutation RequestPasswordReset($email: String!) {
        requestPasswordReset(email: $email) {
          success
          message
        }
      }
    `;

    const res = await server.executeOperation({
      query: RESET_REQUEST_MUTATION,
      variables: { email: 'nonexistent@example.com' }
    });

    expect(res.data.requestPasswordReset.success).toBe(false);
    expect(res.data.requestPasswordReset.message).toContain('Email not found');
  });
});
