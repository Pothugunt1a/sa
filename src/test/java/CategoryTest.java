import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// Import your Category class here
// import com.yourpackage.Category;

class CategoryTest {
    private Category category;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setCategoryId(1);
        category.setCatalogId(100);
        category.setName("Test Category");
        category.setDescription("Test category description");
    }

    @Test
    void testCategoryCreation() {
        assertNotNull(category);
        assertEquals(1, category.getCategoryId());
        assertEquals(100, category.getCatalogId());
        assertEquals("Test Category", category.getName());
        assertEquals("Test category description", category.getDescription());
    }

    @Test
    void testCategoryUpdate() {
        category.setName("Updated Category");
        category.setDescription("Updated description");
        category.setCatalogId(200);

        assertEquals("Updated Category", category.getName());
        assertEquals("Updated description", category.getDescription());
        assertEquals(200, category.getCatalogId());
    }

    @Test
    void testInvalidCatalogId() {
        assertThrows(IllegalArgumentException.class, () -> category.setCatalogId(-1));
    }
}