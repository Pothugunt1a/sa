import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ItemTest {
    private Item item;

    @BeforeEach
    void setUp() {
        item = new Item();
        item.setItemId(1);
        item.setCategoryId(100);
        item.setName("Test Item");
        item.setPrice(9.99);
        item.setStock(10);
        item.setDescription("Test item description");
        item.setImageUrl("http://example.com/image.jpg");
    }

    @Test
    void testItemCreation() {
        assertNotNull(item);
        assertEquals(1, item.getItemId());
        assertEquals(100, item.getCategoryId());
        assertEquals("Test Item", item.getName());
        assertEquals(9.99, item.getPrice(), 0.001);
        assertEquals(10, item.getStock());
        assertEquals("Test item description", item.getDescription());
        assertEquals("http://example.com/image.jpg", item.getImageUrl());
    }

    @Test
    void testItemUpdate() {
        item.setName("Updated Item");
        item.setPrice(19.99);
        item.setStock(20);

        assertEquals("Updated Item", item.getName());
        assertEquals(19.99, item.getPrice(), 0.001);
        assertEquals(20, item.getStock());
    }

    @Test
    void testInvalidPrice() {
        assertThrows(IllegalArgumentException.class, () -> item.setPrice(-1));
    }

    @Test
    void testInvalidStock() {
        assertThrows(IllegalArgumentException.class, () -> item.setStock(-1));
    }
}