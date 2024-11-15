const { gql } = require('apollo-server-express');
const typeDefs = gql`
  type User {
    user_id: ID!
    Username: String!
    email: String!
    registration_date: String
    status: String!
    is_verified: Boolean
    roles: [Role]
    wishlist: [Wishlist]
    shoppingCart: ShoppingCart
    subscriptions: [UserSubscription]
    reviews: [Review]
    orders: [Order]
  }

  type Role {
    role_id: ID!
    role_name: String!
    users: [User]
  }

  type Artist {
    artist_id: ID!
    name: String!
    bio: String
    arts: [Art]
  }

  type Art {
    art_id: ID!
    artist_id: ID!
    title: String!
    description: String
    upload_date: String
    status: String!
    categoryid: ID
    catalog_id: ID
    artist: Artist
    images: [ArtImages]
    reviews: [Review]
    wishlistItems: [Wishlist]
    cartItems: [CartItem]
    storeInventories: [StoreInventory]
    orderItems: [OrderItem]
    returnItems: [ReturnItem]
  }

  type ArtImages {
    image_id: ID!
    art_id: ID!
    image_url: String!
  }

  type Wishlist {
    wishlist_id: ID!
    user_id: ID!
    item_id: ID!
    added_at: String
    user: User
    art: Art
  }

  type ShoppingCart {
    cart_id: ID!
    user_id: ID!
    created_at: String
    updated_at: String
    user: User
    cartItems: [CartItem]
  }

  type CartItem {
    cart_item_id: ID!
    cart_id: ID!
    item_id: ID!
    quantity: Int!
    shoppingCart: ShoppingCart
    art: Art
  }

  type SubscriptionPlan {
    plan_id: ID!
    plan_name: String!
    price: Float!
    features: String
    userSubscriptions: [UserSubscription]
  }

  type UserSubscription {
    subscription_id: ID!
    user_id: ID!
    plan_id: ID!
    start_date: String
    end_date: String
    user: User
    subscriptionPlan: SubscriptionPlan
  }

  type Store {
    store_id: ID!
    store_name: String!
    location: String
    description: String
    storeInventories: [StoreInventory]
  }

  type StoreInventory {
    store_inventory_id: ID!
    store_id: ID!
    item_id: ID!
    stock_quantity: Int!
    last_updated: String
    store: Store
    art: Art
  }

  type Catalog {
    catalog_id: ID!
    name: String!
    artist_id: ID!
    description: String
    artist: Artist
    arts: [Art]
  }

  type Payment {
    _id: ID!
    order_id: String!
    amount: Float!
    payment_method: String!
    payment_status: String!
    email: String!
    full_name: String!
    address1: String!
    address2: String
    city: String!
    state: String!
    transaction_id: String!
    stripe_payment_intent_id: String!
    is_donation: Boolean!
    event_name: String
    event_date: String
    event_venue: String
    event_time: String
    payment_date: String
    clientSecret: String
    created_at: String
    updated_at: String
  }

  type PaymentResponse {
    success: Boolean!
    message: String!
    payment: Payment
  }

  type PaymentIntent {
    clientSecret: String!
  }

  type OrderItem {
    order_item_id: ID!
    order_id: ID!
    item_id: ID!
    quantity: Int!
    price: Float!
    order: Order
    art: Art
  }

  type OrderTracking {
    tracking_id: ID!
    order_id: ID!
    tracking_number: String!
    carrier: String
    status: String!
    updated_at: String
    order: Order
  }

  type Review {
    review_id: ID!
    user_id: ID!
    item_id: ID!
    rating: Int!
    review_text: String
    review_date: String
    user: User
    art: Art
  }

  type Order {
    order_id: ID!
    customer_id: ID!
    total_price: Float!
    status: String!
    payment_status: String!
    shipping_address: String!
    billing_address: String!
    created_at: String
    updated_at: String
    shipping_method: String
    payment_method: String
    user: User
    orderItems: [OrderItem]
    orderTracking: OrderTracking
    payment: Payment
    returnItems: [ReturnItem]
  }

  type ReturnItem {
    return_id: ID!
    order_id: ID!
    item_id: ID!
    reason: String
    return_status: String!
    initiated_at: String
    order: Order
    art: Art
  }

  type UserRole {
    user_id: ID!
    role_id: ID!
    user: User
    role: Role
  }

  type Query {
    users: [User]
    user(id: ID!): User
    roles: [Role]
    role(id: ID!): Role
    artists: [Artist]
    artist(id: ID!): Artist
    arts: [Art]
    art(id: ID!): Art
    getPayment(id: ID!): Payment
    userRoles: [UserRole]
    userRole(userId: ID!, roleId: ID!): UserRole
    getAllPayments: [Payment]!
  }

  type Mutation {
    createUser(input: UserInput!): User
    updateUser(id: ID!, input: UserInput!): User
    deleteUser(id: ID!): Boolean
    createRole(input: RoleInput!): Role
    updateRole(id: ID!, input: RoleInput!): Role
    deleteRole(id: ID!): Boolean
    createArtist(input: ArtistInput!): Artist
    updateArtist(id: ID!, input: ArtistInput!): Artist
    deleteArtist(id: ID!): Boolean
    createArt(input: ArtInput!): Art
    updateArt(id: ID!, input: ArtInput!): Art
    deleteArt(id: ID!): Boolean
    createPayment(input: PaymentInput!): PaymentResponse!
    updatePaymentStatus(paymentId: ID!, status: String!): PaymentResponse!
    createPaymentIntent(amount: Int!, email: String!): PaymentIntent!
    confirmPayment(paymentIntentId: String!): Payment!
    assignRoleToUser(userId: ID!, roleId: ID!): UserRole
    removeRoleFromUser(userId: ID!, roleId: ID!): Boolean
  }

  input UserInput {
    Username: String!
    email: String!
    password: String!
    status: String!
  }

  input RoleInput {
    role_name: String!
  }

  input ArtistInput {
    name: String!
    bio: String
  }

  input ArtInput {
    artist_id: ID!
    title: String!
    description: String
    status: String!
    categoryid: ID
    catalog_id: ID
  }

  input PaymentInput {
    amount: Float!
    payment_method: String
    email: String!
    fullName: String!
    address1: String!
    address2: String
    city: String!
    state: String!
    isEvent: Boolean!
    eventDetails: EventDetailsInput
  }
  input EventDetailsInput {
    eventName: String
    eventDate: String
    eventVenue: String
    eventTime: String
  }
`;

module.exports = typeDefs;








