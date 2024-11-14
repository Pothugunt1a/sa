const mongoose = require('mongoose');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server-express');
const Artist = require('./models/Artist');

describe('Artist Authentication', () => {
  let server;

  beforeAll(async () => {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({ req })
    });
    await mongoose.connect(global.__MONGO_URI__);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Artist.deleteMany({});
  });

  describe('Artist Registration', () => {
    const SIGNUP_MUTATION = gql`
      mutation ArtistSignup($input: ArtistSignupInput!) {
        artistSignup(input: $input) {
          success
          message
          token
          artist {
            artist_id
            email
            firstName
            lastName
            status
          }
        }
      }
    `;

    test('should register new artist successfully', async () => {
      const res = await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: {
          input: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890"
          }
        }
      });

      expect(res.data.artistSignup.success).toBe(true);
      expect(res.data.artistSignup.token).toBeDefined();
      expect(res.data.artistSignup.artist.status).toBe('pending');
    });

    test('should prevent duplicate email registration', async () => {
      // First registration
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: {
          input: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890"
          }
        }
      });

      // Duplicate registration attempt
      const res = await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: {
          input: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890"
          }
        }
      });

      expect(res.data.artistSignup.success).toBe(false);
      expect(res.data.artistSignup.message).toContain('Email already registered');
    });
  });

  describe('Artist Login', () => {
    const LOGIN_MUTATION = gql`
      mutation ArtistLogin($input: ArtistLoginInput!) {
        artistLogin(input: $input) {
          success
          message
          token
          artist {
            artist_id
            email
            status
          }
        }
      }
    `;

    beforeEach(async () => {
      // Create a verified artist
      const artist = new Artist({
        firstName: "Test",
        lastName: "Artist",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        status: "active"
      });
      await artist.save();
    });

    test('should login successfully with correct credentials', async () => {
      const res = await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: "test@example.com",
            password: "password123"
          }
        }
      });

      expect(res.data.artistLogin.success).toBe(true);
      expect(res.data.artistLogin.token).toBeDefined();
    });

    test('should reject login with incorrect password', async () => {
      const res = await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: "test@example.com",
            password: "wrongpassword"
          }
        }
      });

      expect(res.data.artistLogin.success).toBe(false);
      expect(res.data.artistLogin.message).toContain('Invalid credentials');
    });

    test('should prevent unverified artist from logging in', async () => {
      // Create unverified artist
      await Artist.findOneAndUpdate(
        { email: "test@example.com" },
        { status: "pending" }
      );

      const res = await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: "test@example.com",
            password: "password123"
          }
        }
      });

      expect(res.data.artistLogin.success).toBe(false);
      expect(res.data.artistLogin.message).toContain('verify your email');
    });
  });
}); 