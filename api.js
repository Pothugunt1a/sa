const Item = require('./models/Item');
const Category = require('./models/Category');


// Existing Item and Category APIs
const itemApi = {
    getItems: async () => {
        try {
            console.log('Attempting to fetch items from database');
            const items = await Item.find();
            console.log(`Successfully fetched ${items.length} items`);
            return items;
        } catch (error) {
            console.error('Error fetching items:', error.message);
            console.error('Full error:', error);
            throw new Error(`Failed to fetch items: ${error.message}`);
        }
    },

    getItem: async (id) => {
        try {
            return await Item.findById(id);
        } catch (error) {
            console.error(`Error fetching item ${id}:`, error);
            throw new Error(`Failed to fetch item ${id}`);
        }
    },

    createItem: async (input) => {
        try {
            const newItem = new Item(input);
            return await newItem.save();
        } catch (error) {
            console.error('Error creating item:', error);
            throw new Error('Failed to create item');
        }
    },

    updateItem: async (id, input) => {
        try {
            return await Item.findByIdAndUpdate(id, input, { new: true });
        } catch (error) {
            console.error(`Error updating item ${id}:`, error);
            throw new Error(`Failed to update item ${id}`);
        }
    },

    deleteItem: async (id) => {
        try {
            await Item.findByIdAndDelete(id);
            return true;
        } catch (error) {
            console.error(`Error deleting item ${id}:`, error);
            throw new Error(`Failed to delete item ${id}`);
        }
    }
};

const categoryApi = {
    getCategories: async () => {
        try {
            return await Category.find();
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories');
        }
    },

    getCategory: async (id) => {
        try {
            return await Category.findById(id);
        } catch (error) {
            console.error(`Error fetching category ${id}:`, error);
            throw new Error(`Failed to fetch category ${id}`);
        }
    },

    createCategory: async (input) => {
        try {
            const newCategory = new Category(input);
            return await newCategory.save();
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Failed to create category');
        }
    },

    updateCategory: async (id, input) => {
        try {
            return await Category.findByIdAndUpdate(id, input, { new: true });
        } catch (error) {
            console.error(`Error updating category ${id}:`, error);
            throw new Error(`Failed to update category ${id}`);
        }
    },

    deleteCategory: async (id) => {
        try {
            await Category.findByIdAndDelete(id);
            return true;
        } catch (error) {
            console.error(`Error deleting category ${id}:`, error);
            throw new Error(`Failed to delete category ${id}`);
        }
    }
};

// Artist Authentication and Profile APIs
const artistApi = {
    login: async (email, password) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    mutation ArtistLogin($email: String!, $password: String!) {
                        artistLogin(email: $email, password: $password) {
                            success
                            message
                            token
                            artist {
                                artist_id
                                firstName
                                lastName
                                email
                                profileImage
                                bio
                            }
                        }
                    }
                `,
                variables: { email, password }
            })
        });
        return response.json();
    },

    signup: async (artistData) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    mutation ArtistSignup($input: ArtistSignupInput!) {
                        artistSignup(input: $input) {
                            success
                            message
                            token
                            artist {
                                artist_id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                `,
                variables: { input: artistData }
            })
        });
        return response.json();
    },

    requestPasswordReset: async (email) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    mutation RequestReset($email: String!) {
                        requestPasswordReset(email: $email) {
                            success
                            message
                        }
                    }
                `,
                variables: { email }
            })
        });
        return response.json();
    },

    updateProfile: async (artistId, profileData) => {
        const token = localStorage.getItem('artistToken');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                    mutation UpdateProfile($artistId: ID!, $input: ProfileUpdateInput!) {
                        updateArtistProfile(artistId: $artistId, input: $input) {
                            aboutText
                            profileImage
                            displayName
                            address
                            subscription
                            publicLink
                            socialLinks {
                                facebook
                                instagram
                            }
                        }
                    }
                `,
                variables: {
                    artistId,
                    input: profileData
                }
            })
        });
        return response.json();
    },

    getProfile: async (artistId) => {
        const token = localStorage.getItem('artistToken');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                    query GetProfile($artistId: ID!) {
                        getArtistProfile(artistId: $artistId) {
                            aboutText
                            profileImage
                            displayName
                            address
                            subscription
                            publicLink
                            socialLinks {
                                facebook
                                instagram
                            }
                        }
                    }
                `,
                variables: { artistId }
            })
        });
        return response.json();
    }
};

module.exports = {
    itemApi,
    categoryApi,
    artistApi
};
