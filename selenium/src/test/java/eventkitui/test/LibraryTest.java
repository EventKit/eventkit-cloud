package eventkitui.test;

import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.groups.GroupsPage;
import eventkitui.test.page.navpanel.library.LibraryPage;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.Random;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;

/**
 * Tests datapack library page
 */
public class LibraryTest extends SeleniumBaseTest {

    private LibraryPage libraryPage;

    private WebDriverWait wait;
    @Before
    public void openNavPanel() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        navigationPanel.waitUntilLoaded();
        libraryPage = navigationPanel.openDataPackLibrary();
        libraryPage.waitUntilLoaded();

        wait = new WebDriverWait(driver, 10);
    }

    // Tests search field, can we input text.
    @Test
    public void testSearchField() {
        final Random random = new Random();
        // Sending keys directly to element didnt seem to be working for this field.
        final Actions actions = new Actions(driver);
        actions.moveToElement(libraryPage.getSearchBar());
        actions.click();
        String sentText = "Testme" + random.nextLong();
        actions.sendKeys(sentText);
        actions.build().perform();
        assertTrue(sentText.equals(libraryPage.getSearchBar().getAttribute("value")));
    }

    // Opens filter panel, ensures elements are displayed.
    @Test
    public void testFilterPanel() {
        libraryPage.getHideShowFiltersButton().click();
        libraryPage.getFiltersPanel().waitUntilLoaded();
        assertTrue(libraryPage.getFiltersPanel().getApplyFilterButton().isEnabled());
        assertTrue(libraryPage.getFiltersPanel().getClearFiltersButton().isEnabled());
        assertTrue(libraryPage.getFiltersPanel().getPrivateBullet().isEnabled());
        assertTrue(libraryPage.getFiltersPanel().getSharedBullet().isEnabled());
        assertTrue(libraryPage.getFiltersPanel().getFromDateField().isEnabled());
        assertTrue(libraryPage.getFiltersPanel().getToDateField().isEnabled());
    }

    // Only one should be selectable, shared field should display a new button.
    @Test
    public void testPrivateAndPublicFields() {
        libraryPage.getHideShowFiltersButton().click();
        libraryPage.getFiltersPanel().waitUntilLoaded();
        libraryPage.getFiltersPanel().getPrivateBullet().click();
        // checked attribute returns null if not checked.
        boolean checked = libraryPage.getFiltersPanel().getSharedBullet().getAttribute("checked") != null ? true : false;
        assertFalse(checked);
        libraryPage.getFiltersPanel().getSharedBullet().click();
        checked = libraryPage.getFiltersPanel().getPrivateBullet().getAttribute("checked") != null ? true : false;
        assertFalse(checked);
        assertTrue(libraryPage.getFiltersPanel().getAllMembersAllGroupsButton().isDisplayed());
    }

    // Tests functionality of show more/show less button
    // This test will take different paths depending on state of current eventkit-cloud server.
    // (does it even have more to show? for example)
    @Test
    public void testShowMoreShowLess() {
        if(libraryPage.getShowMoreButton().isEnabled()) {
            final WebDriverWait wait = new WebDriverWait(driver, 20);
            // Get current text
            wait.until(ExpectedConditions.elementToBeClickable(libraryPage.getShowMoreButton()));
            libraryPage.getMap().waitUntilLoaded();
            final String currentRange = libraryPage.getDataPackRange().getText();
            libraryPage.getShowMoreButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(libraryPage.getShowLessButton()));
            assertFalse(currentRange.equalsIgnoreCase(libraryPage.getDataPackRange().getText()));
        }
    }

    // Tests calendar and databinding to fields (from date, to date).
    @Test
    public void testCalendar() {
        libraryPage.getHideShowFiltersButton().click();
        libraryPage.getFiltersPanel().waitUntilLoaded();
        libraryPage.getFiltersPanel().getFromDateField().click();
        wait.until(ExpectedConditions.elementToBeClickable(libraryPage.getFiltersPanel().getCalender()));
        assertTrue(libraryPage.getFiltersPanel().getCalender().isDisplayed());
        final String fromDateTextSelection = libraryPage.getFiltersPanel().getToday().getText();
        libraryPage.getFiltersPanel().getToday().click();
        String dayAsText = libraryPage.getFiltersPanel().getFromDateField().getAttribute("value").substring(libraryPage.getFiltersPanel().getFromDateField().getAttribute("value").length() - 2);
        assertTrue(dayAsText.equalsIgnoreCase(fromDateTextSelection));
        libraryPage.getFiltersPanel().getToDateField().click();
        wait.until(ExpectedConditions.elementToBeClickable(libraryPage.getFiltersPanel().getCalender()));
        assertTrue(libraryPage.getFiltersPanel().getCalender().isDisplayed());
        final String toDateTextSelection = libraryPage.getFiltersPanel().getToday().getText();
        libraryPage.getFiltersPanel().getToday().click();
        dayAsText = libraryPage.getFiltersPanel().getToDateField().getAttribute("value").substring(libraryPage.getFiltersPanel().getToDateField().getAttribute("value").length() - 2);
        assertTrue(dayAsText.equalsIgnoreCase(toDateTextSelection));
    }

}
