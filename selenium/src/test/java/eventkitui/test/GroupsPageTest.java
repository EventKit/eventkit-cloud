package eventkitui.test;

import eventkitui.test.page.navpanel.groups.DeleteGroupConfirmation;
import eventkitui.test.page.navpanel.groups.GroupsPage;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.groups.NewGroupPage;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.Random;

import static junit.framework.TestCase.assertTrue;

public class GroupsPageTest extends SeleniumBaseTest {

    private GroupsPage groupsPage;

    private WebDriverWait wait;
    @Before
    public void openNavPanel() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        navigationPanel.waitUntilLoaded();
        groupsPage = navigationPanel.openMembersAndGroups();
        groupsPage.waitUntilLoaded();
        wait = new WebDriverWait(driver, 10);
        // Take care of loading bar.
        By by = new By.ByXPath("//div[contains(@class, 'qa-loading-body')]");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(by));
    }

    @Test
    public void testSearchField() {
        final String initialText = groupsPage.getUserSearchBar().getAttribute("value");
        final Random random = new Random();
        groupsPage.getUserSearchBar().sendKeys("Testme" + random.nextLong());
        assertTrue(!initialText.equals(groupsPage.getUserSearchBar().getAttribute("value")));
    }

    @Test
    public void clickableMembers() {
        assertTrue(groupsPage.getUserRow().isEnabled());
    }

    @Test
    public void clickableSortMenu() {
        groupsPage.getUserSort().click();
        // Waits again due to the spinner getting popped here.
        groupsPage.waitUntilLoaded();
        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getSortByNewest()));
        assertTrue(groupsPage.getSortByNewest().isEnabled());
    }

    // Create group, delete group
    // TODO Discovered bug with groups, if you delete a group you're apart of the UI will fail to load. This test is commented out
    // TODO until that is fixed so that the test account doesn't essentially get locked out
//    @Test
//    public void groupWorkflow() {
//        Utils.takeScreenshot(driver);
//        groupsPage.getCreateGroupButton().click();
//        Utils.takeScreenshot(driver);
//        final NewGroupPage newGroupPage = new NewGroupPage(driver, 5);
//        newGroupPage.waitUntilLoaded();
//        final Random random = new Random();
//        newGroupPage.getGroupNameField().sendKeys("SeleniumGroup" + random.nextLong());
//        Utils.takeScreenshot(driver);
//        newGroupPage.getSaveButton().click();
//        Utils.takeScreenshot(driver);
//        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getGroupOptions()));
//        groupsPage.getGroupOptions().click();
//        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getDeleteGroupButton()));
//        groupsPage.getDeleteGroupButton().click();
//        Utils.takeScreenshot(driver);
//        final DeleteGroupConfirmation deleteGroupConfirmation = new DeleteGroupConfirmation(driver,10);
//        deleteGroupConfirmation.waitUntilLoaded();
//        Utils.takeScreenshot(driver);
//        deleteGroupConfirmation.getDeleteGroupButton().click();
//        Utils.takeScreenshot(driver);
//    }
}
