const User = require('../models/User');
const Role = require('../models/Role');
const Artist = require('../models/Artist');
const Art = require('../models/Art');
const UserRole = require('../models/UserRole');
const Payment = require('../models/Payment');
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
        const payment = await Payment.findById(id);
        if (!payment) {
          console.log(`Payment with id ${id} not found`);
          return null;
        }
        console.log('Found payment:', payment);
        return payment;
      } catch (error) {
        console.error(`Error fetching payment ${id}:`, error);
        throw new Error(`Failed to fetch payment: ${error.message}`);
      }
    },
    getAllPayments: async () => {
      try {
        return await Payment.find();
      } catch (error) {
        console.error('Error fetching all payments:', error);
        throw new Error('Failed to fetch payments');
      }
    }
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
          payment_method, 
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
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          payment_method_types: [payment_method || 'card'],
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

        if (!paymentIntent || !paymentIntent.id) {
          throw new Error('Failed to create Stripe payment intent');
        }

        // Create payment record in database
        const payment = new Payment({
          stripe_payment_intent_id: paymentIntent.id, // Ensure this is set
          order_id: `ORDER-${Date.now()}`,
          amount,
          payment_method: payment_method || 'card',
          payment_status: 'pending',
          email,
          full_name: fullName,
          address1,
          address2,
          city,
          state,
          transaction_id: paymentIntent.id,
          is_donation: !isEvent,
          event_name: eventDetails?.eventName,
          event_date: eventDetails?.eventDate,
          event_venue: eventDetails?.eventVenue,
          event_time: eventDetails?.eventTime
        });

        const savedPayment = await payment.save();
        console.log('Payment saved to database:', savedPayment);

        if (!savedPayment) {
          throw new Error('Failed to save payment to database');
        }

        return {
          success: true,
          message: 'Payment created successfully',
          payment: {
            ...savedPayment.toObject(),
            clientSecret: paymentIntent.client_secret
          }
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        return {
          success: false,
          message: `Failed to create payment: ${error.message}`,
          payment: null
        };
      }
    },
    updatePaymentStatus: async (_, { paymentId, status }) => {
      try {
        const payment = await Payment.findOne({ _id: paymentId });
        
        if (!payment) {
          return {
            success: false,
            message: 'Payment not found',
            payment: null
          };
        }

        payment.payment_status = status;
        if (status === 'completed') {
          payment.payment_date = new Date();
        }
        
        await payment.save();

        return {
          success: true,
          message: 'Payment status updated successfully',
          payment: payment
        };
      } catch (error) {
        console.error('Error updating payment status:', error);
        return {
          success: false,
          message: `Failed to update payment status: ${error.message}`,
          payment: null
        };
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
        
        if (!paymentIntent) {
          throw new Error('Payment intent not found');
        }

        if (paymentIntent.status === 'succeeded') {
          // Find the payment first
          const payment = await Payment.findOne({ stripe_payment_intent_id: paymentIntentId });
          
          if (!payment) {
            throw new Error('Payment record not found in database');
          }

          // Update the payment
          payment.payment_status = 'completed';
          payment.payment_date = new Date();
          
          const updatedPayment = await payment.save();
          
          if (!updatedPayment) {
            throw new Error('Failed to update payment status');
          }

          return updatedPayment;
        } else {
          throw new Error(`Payment is in ${paymentIntent.status} state. Unable to confirm.`);
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        throw new Error(`Failed to confirm payment: ${error.message}`);
      }
    },
    // Add more mutations
  },
  User: {
    roles: async (user) => await Role.find({ role_id: { $in: user.roles } }),
  },
  Role: {
    users: async (role) => await User.find({ roles: role.role_id }),
  },
  Artist: {
    arts: async (artist) => await Art.find({ artist_id: artist.artist_id }),
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
