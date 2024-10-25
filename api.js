const Item = require('./models/Item');
const Category = require('./models/Category');

async function getItems() {
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
}

async function getItem(id) {
  try {
    return await Item.findById(id);
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw new Error(`Failed to fetch item ${id}`);
  }
}

async function createItem(input) {
  try {
    const newItem = new Item(input);
    return await newItem.save();
  } catch (error) {
    console.error('Error creating item:', error);
    throw new Error('Failed to create item');
  }
}

async function updateItem(id, input) {
  try {
    return await Item.findByIdAndUpdate(id, input, { new: true });
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw new Error(`Failed to update item ${id}`);
  }
}

async function deleteItem(id) {
  try {
    await Item.findByIdAndDelete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw new Error(`Failed to delete item ${id}`);
  }
}

async function getCategories() {
  try {
    return await Category.find();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

async function getCategory(id) {
  try {
    return await Category.findById(id);
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw new Error(`Failed to fetch category ${id}`);
  }
}

async function createCategory(input) {
  try {
    const newCategory = new Category(input);
    return await newCategory.save();
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error('Failed to create category');
  }
}

async function updateCategory(id, input) {
  try {
    return await Category.findByIdAndUpdate(id, input, { new: true });
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw new Error(`Failed to update category ${id}`);
  }
}

async function deleteCategory(id) {
  try {
    await Category.findByIdAndDelete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw new Error(`Failed to delete category ${id}`);
  }
}

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};