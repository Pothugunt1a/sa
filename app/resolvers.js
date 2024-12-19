const User = require('../models/User');
const Role = require('../models/Role');
const Artist = require('../models/Artist');
const Art = require('../models/Art');
const UserRole = require('../models/UserRole');
const Payment = require('../models/Payment');
const EventRegistration = require('../models/EventRegistration');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Artwork = require('../models/Artwork');
// Import other models as needed
const resolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_, { id }) => await User.findOne({ user_id: id }),
    roles: async () => await Role.find(),
    role: async (_, { id }) => await Role.findOne({ role_id: id }),
    artists: async () => await Artist.find(),
    artist: async (_, { id }) => await Artist.findOne({ artist_id: id }),
    arts: async () => await Art.find(),
    art: async (_, { id }) => await Art.findOne({ art_id: id }),
    userRoles: async () => await UserRole.find(),
    userRole: async (_, { userId, roleId }) => await UserRole.findOne({ user_id: userId, role_id: roleId }),
    getPayment: async (_, { id }) => {
      try {
        console.log('Looking for payment with ID:', id);
        const payment = await Payment.findById(id);
        
        if (!payment) {
          console.log(`Payment with id ${id} not found`);
          return null;
        }
        
        console.log('Found payment:', payment);
        return payment;
      } catch (error) {
        console.error('Error fetching payment:', error);
        throw new Error(`Failed to fetch payment: ${error.message}`);
      }
    },
    getAllPayments: async () => {
      try {
        return await Payment.find();
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw new Error('Failed to fetch payments');
      }
    },
    getEventRegistration: async (_, { id }) => {
      try {
        return await EventRegistration.findOne({ registration_id: id });
      } catch (error) {
        throw new Error(`Failed to fetch registration: ${error.message}`);
      }
    },
    getAllEventRegistrations: async () => {
      try {
        return await EventRegistration.find();
      } catch (error) {
        throw new Error(`Failed to fetch registrations: ${error.message}`);
      }
    },
    getEventRegistrationsByEmail: async (_, { email }) => {
      try {
        return await EventRegistration.find({ email });
      } catch (error) {
        throw new Error(`Failed to fetch registrations: ${error.message}`);
      }
    },
    getPaymentByRegistrationId: async (_, { registrationId }) => {
      try {
        console.log('Looking for payment with registration ID:', registrationId);
        const payment = await Payment.findByRegistrationId(registrationId);
        
        if (!payment) {
          console.log(`No payment found for registration ${registrationId}`);
          return null;
        }
        
        console.log('Found payment:', payment);
        return payment;
      } catch (error) {
        console.error('Error fetching payment by registration ID:', error);
        throw new Error(`Failed to fetch payment: ${error.message}`);
      }
    },
    getRegistrationsByEmail: async (_, { email }) => {
      try {
        const registrations = await EventRegistration.find({ email });
        console.log(`Found ${registrations.length} registrations for email: ${email}`);
        return registrations;
      } catch (error) {
        console.error('Error fetching registrations by email:', error);
        throw new Error(`Failed to fetch registrations: ${error.message}`);
      }
    },
    getRegistrationDetails: async (_, { registrationId }) => {
      try {
        const registration = await EventRegistration.findOne({ 
          registration_id: registrationId 
        });
        
        if (!registration) {
          throw new Error('Registration not found');
        }

        let payment = null;
        if (registration.payment_id) {
          payment = await Payment.findOne({ payment_id: registration.payment_id });
        }

        return {
          registration,
          payment
        };
      } catch (error) {
        console.error('Error fetching registration details:', error);
        throw new Error(`Failed to fetch registration details: ${error.message}`);
      }
    },
    getRegistrationWithPayment: async (_, { registrationId }) => {
      try {
        const registration = await EventRegistration.findOne({ 
          registration_id: registrationId 
        });
        
        if (!registration) {
          throw new Error('Registration not found');
        }

        let payment = null;
        if (registration.payment_id) {
          payment = await Payment.findOne({ payment_id: registration.payment_id });
        }

        return {
          registration,
          payment,
          isFreeEvent: registration.payment_status === 'free'
        };
      } catch (error) {
        console.error('Error fetching registration details:', error);
        throw new Error(`Failed to fetch registration details: ${error.message}`);
      }
    },
    getArtistProfile: async (_, { artistId }) => {
      try {
        const artist = await Artist.findOne({ artist_id: artistId });
        if (!artist) {
          throw new Error('Artist not found');
        }
        return {
          aboutText: artist.bio,
          profileImage: artist.profileImage,
          displayName: artist.displayName || `${artist.firstName} ${artist.lastName}`,
          address: artist.address,
          subscription: artist.subscription,
          publicLink: artist.publicLink,
          socialLinks: artist.socialLinks
        };
      } catch (error) {
        throw new Error(`Failed to fetch artist profile: ${error.message}`);
      }
    },
    getArtistArtworks: async (_, { artistId }) => {
      try {
        return await Artwork.find({ artist_id: artistId });
      } catch (error) {
        throw new Error(`Failed to fetch artworks: ${error.message}`);
      }
    },
    getArtistPublicProfile: async (_, { artistId }) => {
      try {
        const artist = await Artist.findOne({ artist_id: artistId });
        if (!artist) {
          throw new Error('Artist not found');
        }
        return {
          aboutText: artist.bio,
          profileImage: artist.profileImage,
          displayName: artist.displayName || `${artist.firstName} ${artist.lastName}`,
          socialLinks: artist.socialLinks
        };
      } catch (error) {
        throw new Error(`Failed to fetch public profile: ${error.message}`);
      }
    },
    getArtistByEmail: async (_, { email }) => {
      try {
        return await Artist.findOne({ email });
      } catch (error) {
        throw new Error(`Failed to fetch artist: ${error.message}`);
      }
    },
    // Add more queries
  },
  Mutation: {
    createUser: async (_, { input }) => {
      const user = new User(input);
      await user.save();
      return user;
    },
    updateUser: async (_, { id, input }) => {
      return await User.findOneAndUpdate({ user_id: id }, input, { new: true });
    },
    deleteUser: async (_, { id }) => {
      await User.findOneAndDelete({ user_id: id });
      return true;
    },
    createRole: async (_, { input }) => {
      const role = new Role(input);
      await role.save();
      return role;
    },
    updateRole: async (_, { id, input }) => {
      return await Role.findOneAndUpdate({ role_id: id }, input, { new: true });
    },
    deleteRole: async (_, { id }) => {
      await Role.findOneAndDelete({ role_id: id });
      return true;
    },
    createArtist: async (_, { input }) => {
      const artist = new Artist(input);
      await artist.save();
      return artist;
    },
    updateArtist: async (_, { id, input }) => {
      return await Artist.findOneAndUpdate({ artist_id: id }, input, { new: true });
    },
    deleteArtist: async (_, { id }) => {
      await Artist.findOneAndDelete({ artist_id: id });
      return true;
    },
    createArt: async (_, { input }) => {
      const art = new Art(input);
      await art.save();
      return art;
    },
    updateArt: async (_, { id, input }) => {
      return await Art.findOneAndUpdate({ art_id: id }, input, { new: true });
    },
    deleteArt: async (_, { id }) => {
      await Art.findOneAndDelete({ art_id: id });
      return true;
    },
    assignRoleToUser: async (_, { userId, roleId }) => {
      const userRole = new UserRole({ user_id: userId, role_id: roleId });
      await userRole.save();
      return userRole;
    },
    removeRoleFromUser: async (_, { userId, roleId }) => {
      await UserRole.findOneAndDelete({ user_id: userId, role_id: roleId });
      return true;
    },
    createPayment: async (_, { input }, { stripe }) => {
      try {
        const { 
          amount, 
          email, 
          fullName, 
          address1, 
          address2, 
          city, 
          state,
          isEvent,
          eventDetails 
        } = input;

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          receipt_email: email,
          metadata: {
            full_name: fullName,
            address1,
            address2,
            city,
            state,
            is_event: isEvent ? 'true' : 'false',
            event_name: eventDetails?.eventName,
            event_date: eventDetails?.eventDate,
            event_venue: eventDetails?.eventVenue,
            event_time: eventDetails?.eventTime
          }
        });

        // Create payment record in MongoDB
        const payment = new Payment({
          stripe_payment_intent_id: paymentIntent.id,
          order_id: `ORDER-${Date.now()}`,
          amount: amount,
          payment_method: 'card',
          payment_status: 'pending',
          email,
          full_name: fullName,
          address1,
          address2: address2 || '',
          city,
          state,
          transaction_id: paymentIntent.id,
          is_donation: !isEvent,
          event_name: eventDetails?.eventName,
          event_date: eventDetails?.eventDate,
          event_venue: eventDetails?.eventVenue,
          event_time: eventDetails?.eventTime,
          registration_id: input.registrationId
        });

        await payment.save();
        console.log('Payment saved:', payment);

        // Update registration with payment ID
        if (input.registrationId) {
          const registration = await EventRegistration.findOne({ 
            registration_id: input.registrationId 
          });
          if (registration) {
            await registration.updatePaymentStatus('pending', payment.payment_id);
            console.log('Registration updated with payment:', registration);
          }
        }

        return {
          success: true,
          message: 'Payment created successfully',
          payment,
          clientSecret: paymentIntent.client_secret
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error(`Failed to create payment: ${error.message}`);
      }
    },
    updatePaymentStatus: async (_, { paymentIntentId, status }) => {
      try {
        const payment = await Payment.findOneAndUpdate(
          { stripe_payment_intent_id: paymentIntentId },
          { 
            payment_status: status,
            payment_date: new Date()
          },
          { new: true }
        );

        if (!payment) {
          throw new Error('Payment record not found');
        }

        return {
          success: true,
          message: 'Payment status updated successfully',
          payment
        };
      } catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error(`Failed to update payment status: ${error.message}`);
      }
    },
    createPaymentIntent: async (_, { amount, email }, { stripe }) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          receipt_email: email,
        });

        return { clientSecret: paymentIntent.client_secret };
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw new Error('Failed to create payment intent');
      }
    },
    confirmPayment: async (_, { paymentIntentId }, { stripe }) => {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
          // Update payment record in MongoDB
          const payment = await Payment.findOneAndUpdate(
            { stripe_payment_intent_id: paymentIntentId },
            {
              payment_status: 'completed',
              payment_date: new Date()
            },
            { new: true }
          );

          if (!payment) {
            throw new Error('Payment record not found in MongoDB');
          }

          return payment;
        } else {
          throw new Error(`Payment is in ${paymentIntent.status} state. Unable to confirm.`);
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        throw new Error(`Failed to confirm payment: ${error.message}`);
      }
    },
    createEventRegistration: async (_, { input }) => {
      try {
        console.log('Received registration input:', input);

        // Validate required fields
        if (!input.eventName || !input.email) {
          throw new Error('Missing required fields');
        }

        // Create registration record
        const registration = new EventRegistration({
          event_id: input.event_id || 1,
          event_name: input.eventName,
          event_date: input.eventDate,
          event_venue: input.eventVenue,
          event_time: input.eventTime,
          first_name: input.firstName,
          middle_name: input.middleName,
          last_name: input.lastName,
          email: input.email,
          contact: input.contact,
          address1: input.address1,
          address2: input.address2,
          city: input.city,
          state: input.state,
          zipcode: input.zipcode,
          payment_amount: input.paymentAmount || 0,
          payment_status: input.paymentAmount > 0 ? 'pending' : 'free',
          registration_date: new Date()
        });

        console.log('Attempting to save registration:', registration);

        const savedRegistration = await registration.save();
        console.log('Successfully saved registration:', savedRegistration);

        return {
          success: true,
          message: 'Event registration created successfully',
          registration: savedRegistration
        };
      } catch (error) {
        console.error('Error creating event registration:', error);
        return {
          success: false,
          message: `Failed to create registration: ${error.message}`,
          registration: null
        };
      }
    },
    updateEventRegistrationPaymentStatus: async (_, { registrationId, paymentStatus }) => {
      try {
        console.log(`Updating registration ${registrationId} to status ${paymentStatus}`); // Debug log

        const registration = await EventRegistration.findOneAndUpdate(
          { registration_id: registrationId },
          { 
            payment_status: paymentStatus,
            updatedAt: new Date()
          },
          { new: true }
        );

        if (!registration) {
          throw new Error('Registration not found');
        }

        console.log('Updated registration:', registration); // Debug log

        return {
          success: true,
          message: 'Registration payment status updated successfully',
          registration
        };
      } catch (error) {
        console.error('Error updating registration payment status:', error);
        return {
          success: false,
          message: `Failed to update registration status: ${error.message}`,
          registration: null
        };
      }
    },
    registerForEvent: async (_, { input }, { stripe }) => {
      try {
        console.log('Processing event registration:', input);

        // 1. Create event registration
        const registration = new EventRegistration({
          event_id: input.event_id,
          event_name: input.eventName,
          event_date: input.eventDate,
          event_venue: input.eventVenue,
          event_time: input.eventTime,
          first_name: input.firstName,
          middle_name: input.middleName || '',
          last_name: input.lastName,
          email: input.email,
          contact: input.contact,
          address1: input.address1,
          address2: input.address2 || '',
          city: input.city,
          state: input.state,
          zipcode: input.zipcode,
          payment_amount: input.paymentAmount || 0
        });

        // If it's a free event
        if (!input.paymentAmount || input.paymentAmount === 0) {
          await registration.markAsFree();
          console.log('Free event registration saved:', registration);
          
          return {
            success: true,
            message: 'Free event registration completed',
            registration: registration
          };
        }

        // For paid events
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.paymentAmount * 100),
          currency: 'usd',
          metadata: {
            registration_id: registration.registration_id,
            event_name: input.eventName,
            email: input.email
          }
        });

        // Create payment record
        const payment = new Payment({
          registration_id: registration.registration_id,
          stripe_payment_intent_id: paymentIntent.id,
          order_id: `ORDER-${Date.now()}`,
          amount: input.paymentAmount,
          payment_method: 'card',
          payment_status: 'pending',
          email: input.email,
          full_name: `${input.firstName} ${input.lastName}`,
          address1: input.address1,
          address2: input.address2,
          city: input.city,
          state: input.state,
          event_name: input.eventName,
          event_date: input.eventDate,
          event_venue: input.eventVenue,
          event_time: input.eventTime
        });

        const savedPayment = await payment.save();
        console.log('Payment record created:', savedPayment);

        // Link payment to registration
        await registration.linkPayment(savedPayment.payment_id);
        const savedRegistration = await registration.save();
        console.log('Registration linked with payment:', savedRegistration);

        return {
          success: true,
          message: 'Registration created with payment',
          registration: savedRegistration,
          paymentIntent: {
            clientSecret: paymentIntent.client_secret
          }
        };
      } catch (error) {
        console.error('Error in registerForEvent:', error);
        return {
          success: false,
          message: error.message,
          registration: null
        };
      }
    },
    artistSignup: async (_, { input }) => {
      try {
        // Check if artist already exists
        const existingArtist = await Artist.findOne({ email: input.email });
        if (existingArtist) {
          return {
            success: false,
            message: 'Email already registered'
          };
        }

        // Create new artist
        const artist = new Artist({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          password: input.password, // Will be hashed by pre-save hook
          phone: input.phone,
          city: input.city || '',
          state: input.state || '',
          country: input.country || ''
        });

        await artist.save();
        const token = artist.generateAuthToken();

        return {
          success: true,
          message: 'Registration successful',
          token,
          artist: {
            email: artist.email,
            firstName: artist.firstName,
            lastName: artist.lastName
          }
        };
      } catch (error) {
        console.error('Signup error:', error);
        return {
          success: false,
          message: error.message || 'Error creating account'
        };
      }
    },

    artistLogin: async (_, { email, password }) => {
      try {
        // Find artist by email
        const artist = await Artist.findOne({ email });
        if (!artist) {
          return {
            success: false,
            message: 'Email is not registered'
          };
        }

        // Verify password
        const isValidPassword = await artist.comparePassword(password);
        if (!isValidPassword) {
          return {
            success: false,
            message: 'Invalid password'
          };
        }

        // Generate token
        const token = artist.generateAuthToken();

        return {
          success: true,
          message: 'Login successful',
          token,
          artist: {
            email: artist.email,
            firstName: artist.firstName,
            lastName: artist.lastName
          }
        };
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          message: 'An error occurred during login'
        };
      }
    },

    requestPasswordReset: async (_, { email }) => {
      try {
        const artist = await Artist.findOne({ email });
        if (!artist) {
          return {
            success: false,
            message: 'Email not found'
          };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        artist.resetPasswordToken = resetToken;
        artist.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
        await artist.save();

        // Setup email transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await transporter.sendMail({
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        });

        return {
          success: true,
          message: 'Password reset link sent to your email'
        };
      } catch (error) {
        console.error('Password reset request error:', error);
        return {
          success: false,
          message: 'Error sending reset link'
        };
      }
    },

    resetPassword: async (_, { token, newPassword }) => {
      try {
        // Find artist with valid reset token
        const artist = await Artist.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() }
        });

        if (!artist) {
          return {
            success: false,
            message: 'Invalid or expired reset token'
          };
        }

        // Update password and clear reset token
        artist.password = newPassword;
        artist.resetPasswordToken = undefined;
        artist.resetPasswordExpires = undefined;
        await artist.save();

        return {
          success: true,
          message: 'Password has been reset successfully'
        };
      } catch (error) {
        console.error('Password reset error:', error);
        return {
          success: false,
          message: 'Error resetting password'
        };
      }
    },

    updateArtistProfile: async (_, { artistId, input }) => {
      try {
        const artist = await Artist.findOneAndUpdate(
          { artist_id: artistId },
          {
            $set: {
              bio: input.aboutText,
              profileImage: input.profileImage,
              displayName: input.displayName,
              address: input.address,
              subscription: input.subscription,
              publicLink: input.publicLink,
              socialLinks: input.socialLinks
            }
          },
          { new: true }
        );

        if (!artist) {
          throw new Error('Artist not found');
        }

        return {
          aboutText: artist.bio,
          profileImage: artist.profileImage,
          displayName: artist.displayName,
          address: artist.address,
          subscription: artist.subscription,
          publicLink: artist.publicLink,
          socialLinks: artist.socialLinks
        };
      } catch (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }
    },

    addArtwork: async (_, { artistId, input }) => {
      try {
        const artwork = new Artwork({
          ...input,
          artist_id: artistId
        });
        return await artwork.save();
      } catch (error) {
        throw new Error(`Failed to add artwork: ${error.message}`);
      }
    },

    updateArtwork: async (_, { artworkId, input }) => {
      try {
        return await Artwork.findByIdAndUpdate(
          artworkId,
          { $set: input },
          { new: true }
        );
      } catch (error) {
        throw new Error(`Failed to update artwork: ${error.message}`);
      }
    },

    deleteArtwork: async (_, { artworkId }) => {
      try {
        const result = await Artwork.findByIdAndDelete(artworkId);
        return !!result;
      } catch (error) {
        throw new Error(`Failed to delete artwork: ${error.message}`);
      }
    }
  },
  User: {
    roles: async (user) => await Role.find({ role_id: { $in: user.roles } }),
  },
  Role: {
    users: async (role) => await User.find({ roles: role.role_id }),
  },
  Artist: {
    artworks: async (artist) => await Artwork.find({ artist_id: artist.artist_id }),
  },
  Art: {
    artist: async (art) => await Artist.findOne({ artist_id: art.artist_id }),
  },
  UserRole: {
    user: async (userRole) => await User.findOne({ user_id: userRole.user_id }),
    role: async (userRole) => await Role.findOne({ role_id: userRole.role_id }),
  },
};

module.exports = resolvers;
