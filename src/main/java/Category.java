public class Category {
    private int categoryId;
    private int catalogId;
    private String name;
    private String description;

    // Getters and setters
    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public int getCatalogId() { return catalogId; }
    public void setCatalogId(int catalogId) {
        if (catalogId < 0) throw new IllegalArgumentException("Catalog ID must be non-negative");
        this.catalogId = catalogId;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // Add this main method
    public static void main(String[] args) {
        System.out.println("Category class loaded successfully.");
        
        // You can add some test code here if you want
        Category testCategory = new Category();
        testCategory.setCategoryId(1);
        testCategory.setCatalogId(100);
        testCategory.setName("Test Category");
        testCategory.setDescription("This is a test category");
        
        System.out.println("Test Category created:");
        System.out.println("ID: " + testCategory.getCategoryId());
        System.out.println("Catalog ID: " + testCategory.getCatalogId());
        System.out.println("Name: " + testCategory.getName());
        System.out.println("Description: " + testCategory.getDescription());
    }
}