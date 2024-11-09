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
      const payment = await Payment.findOne({ payment_id: id });
      if (!payment) {
        console.log(`Payment with id ${id} not found`);
      } else {
        console.log('Found payment:', payment); // Add this line for debugging
      }
      return payment;
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
        const { order_id, amount, payment_method, email, fullName, address1, address2, city, state, isEvent, eventDetails } = input;

        // Create payment intent in Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          payment_method_types: [payment_method],
          receipt_email: email,
          metadata: {
            order_id,
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

        // Store payment data in MongoDB
        const payment = new Payment({
          order_id,
          amount,
          payment_method,
          payment_status: 'pending',
          transaction_id: paymentIntent.id,
          stripe_payment_intent_id: paymentIntent.id,
          email,
          full_name: fullName,
          address1,
          address2,
          city,
          state,
          is_donation: !isEvent,
          event_name: eventDetails?.eventName,
          event_date: eventDetails?.eventDate,
          event_venue: eventDetails?.eventVenue,
          event_time: eventDetails?.eventTime
        });
        await payment.save();
        console.log('Payment saved to MongoDB:', payment);

        return {
          ...payment.toObject(),
          clientSecret: paymentIntent.client_secret
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error(`Failed to create payment: ${error.message}`);
      }
    },
    updatePaymentStatus: async (_, { id, status }) => {
      const updatedPayment = await Payment.findOneAndUpdate(
        { payment_id: id },
        { payment_status: status },
        { new: true }
      );
      if (!updatedPayment) {
        throw new Error(`Payment with id ${id} not found`);
      }
      return {
        order_id: updatedPayment.order_id,
        payment_status: updatedPayment.payment_status,
        stripe_payment_intent_id: updatedPayment.stripe_payment_intent_id
      };
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
