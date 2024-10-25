// Collection-level variables
pm.collectionVariables.set("graphql_url", "http://localhost:4000/graphql");

// Helper function to send GraphQL requests
function sendGraphQLRequest(query, variables = {}) {
    pm.sendRequest({
        url: pm.collectionVariables.get("graphql_url"),
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({ query, variables })
        }
    }, function (err, res) {
        pm.test("Status code is 200", function () {
            pm.response.to.have.status(200);
        });
        
        if (!err) {
            pm.test("Response has no errors", function () {
                const jsonData = res.json();
                pm.expect(jsonData.errors).to.be.undefined;
            });
        }
        
        // Run additional tests specific to each request
        if (pm.variables.get("additional_tests")) {
            eval(pm.variables.get("additional_tests"));
        }
    });
}

// Item Tests

// Create Item
pm.test("Create Item", function () {
    const query = `
    mutation CreateItem($input: ItemInput!) {
        createItem(input: $input) {
            _id
            name
            price
            stock
            description
            image_url
            category_id
        }
    }`;
    
    const variables = {
        input: {
            category_id: "{{category_id}}",
            name: "Test Item",
            price: 9.99,
            stock: 10,
            description: "Test description",
            image_url: "http://example.com/image.jpg"
        }
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const createdItem = jsonData.data.createItem;
        pm.expect(createdItem.name).to.equal("Test Item");
        pm.collectionVariables.set("item_id", createdItem._id);
    `);
    
    sendGraphQLRequest(query, variables);
});

// Get Item
pm.test("Get Item", function () {
    const query = `
    query GetItem($id: ID!) {
        item(id: $id) {
            _id
            name
            price
            stock
            description
            image_url
            category_id
        }
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("item_id")
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const item = jsonData.data.item;
        pm.expect(item.name).to.equal("Test Item");
    `);
    
    sendGraphQLRequest(query, variables);
});

// Update Item
pm.test("Update Item", function () {
    const query = `
    mutation UpdateItem($id: ID!, $input: ItemInput!) {
        updateItem(id: $id, input: $input) {
            _id
            name
            price
            stock
            description
            image_url
            category_id
        }
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("item_id"),
        input: {
            category_id: "{{category_id}}",
            name: "Updated Test Item",
            price: 19.99,
            stock: 20,
            description: "Updated test description",
            image_url: "http://example.com/updated-image.jpg"
        }
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const updatedItem = jsonData.data.updateItem;
        pm.expect(updatedItem.name).to.equal("Updated Test Item");
    `);
    
    sendGraphQLRequest(query, variables);
});

// Delete Item
pm.test("Delete Item", function () {
    const query = `
    mutation DeleteItem($id: ID!) {
        deleteItem(id: $id)
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("item_id")
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        pm.expect(jsonData.data.deleteItem).to.be.true;
    `);
    
    sendGraphQLRequest(query, variables);
});

// Category Tests

// Create Category
pm.test("Create Category", function () {
    const query = `
    mutation CreateCategory($input: CategoryInput!) {
        createCategory(input: $input) {
            _id
            catalog_id
            name
            description
        }
    }`;
    
    const variables = {
        input: {
            catalog_id: "cat1",
            name: "Test Category",
            description: "Test category description"
        }
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const createdCategory = jsonData.data.createCategory;
        pm.expect(createdCategory.name).to.equal("Test Category");
        pm.collectionVariables.set("category_id", createdCategory._id);
    `);
    
    sendGraphQLRequest(query, variables);
});

// Get Category
pm.test("Get Category", function () {
    const query = `
    query GetCategory($id: ID!) {
        category(id: $id) {
            _id
            catalog_id
            name
            description
        }
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("category_id")
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const category = jsonData.data.category;
        pm.expect(category.name).to.equal("Test Category");
    `);
    
    sendGraphQLRequest(query, variables);
});

// Update Category
pm.test("Update Category", function () {
    const query = `
    mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
        updateCategory(id: $id, input: $input) {
            _id
            catalog_id
            name
            description
        }
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("category_id"),
        input: {
            catalog_id: "cat1",
            name: "Updated Test Category",
            description: "Updated test category description"
        }
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        const updatedCategory = jsonData.data.updateCategory;
        pm.expect(updatedCategory.name).to.equal("Updated Test Category");
    `);
    
    sendGraphQLRequest(query, variables);
});

// Delete Category
pm.test("Delete Category", function () {
    const query = `
    mutation DeleteCategory($id: ID!) {
        deleteCategory(id: $id)
    }`;
    
    const variables = {
        id: pm.collectionVariables.get("category_id")
    };
    
    pm.variables.set("additional_tests", `
        const jsonData = res.json();
        pm.expect(jsonData.data.deleteCategory).to.be.true;
    `);
    
    sendGraphQLRequest(query, variables);
});