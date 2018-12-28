package eventkitui.test;

import eventkitui.test.page.navpanel.groups.*;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.rmi.CORBA.Util;
import java.util.Random;

import static junit.framework.TestCase.assertTrue;

public class GroupsPageTest extends SeleniumBaseTest {

    private GroupsPage groupsPage;

    private By loadingBar = new By.ByXPath("//div[contains(@class, 'qa-loading-body')]");

    private WebDriverWait wait;
    @Before
    public void openNavPanel() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        navigationPanel.waitUntilLoaded();
        groupsPage = navigationPanel.openMembersAndGroups();
        groupsPage.waitUntilLoaded();
        wait = new WebDriverWait(driver, 10);
        // Take care of loading bar.
        wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingBar));
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
        try {
            assertTrue(groupsPage.getUserRow().isEnabled());
        }
        catch (NoSuchElementException noSuchElement) {
            System.out.println("This is an optional test. These elements may not appear depending on the state of eventkit-cloud.");
        }
    }

    @Test
    public void clickableSortMenu() {
        groupsPage.getUserSort().click();
        // Waits again due to the spinner getting popped here.
        groupsPage.waitUntilLoaded();
        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getSortByNewest()));
        assertTrue(groupsPage.getSortByNewest().isEnabled());
    }

    // Create group, rename group, delete group
    @Test
    public void groupWorkflow() {
        groupsPage.getCreateGroupButton().click();
        final NewGroupPage newGroupPage = new NewGroupPage(driver, 5);
        newGroupPage.waitUntilLoaded();
        // Save button should not be enabled until text is entered
        assertTrue(!newGroupPage.getSaveButton().isEnabled());
        final Random random = new Random();
        String groupName = "SeleniumGroup" + random.nextLong();
        newGroupPage.getGroupNameField().sendKeys(groupName);
        assertTrue(newGroupPage.getGroupNameField().getAttribute("value").equalsIgnoreCase(groupName));
        assertTrue(newGroupPage.getSaveButton().isEnabled());
        assertTrue(newGroupPage.getCancelButton().isEnabled());
        newGroupPage.getSaveButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getGroupOptions()));
        assertTrue(groupsPage.getGroupOptions().isEnabled());
        wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingBar));
        // Rename tests.
        groupsPage.getGroupOptions().click();
        groupsPage.getChangeGroupNameButton().click();
        final RenameGroupPage renameGroupPage = new RenameGroupPage(driver, 10);
        renameGroupPage.waitUntilLoaded();
        assertTrue(renameGroupPage.getCancelButton().isEnabled());
        assertTrue(!renameGroupPage.getSaveButton().isEnabled());
        final String renamedName = "Rename:" + random.nextLong();
        renameGroupPage.getRenameField().sendKeys(renamedName);
        assertTrue(renameGroupPage.getRenameField().getAttribute("value").equalsIgnoreCase(renamedName));
        renameGroupPage.getSaveButton().click();
        wait.until(ExpectedConditions.refreshed(ExpectedConditions.elementToBeClickable(groupsPage.getGroupOptions())));
        wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingBar));
        groupsPage.getGroupOptions().click();
        wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getDeleteGroupButton()));
        assertTrue(groupsPage.getDeleteGroupButton().isEnabled());
        assertTrue(groupsPage.getLeaveGroupButton().isEnabled());
        assertTrue(groupsPage.getChangeGroupNameButton().isEnabled());
        groupsPage.getDeleteGroupButton().click();
        final DeleteGroupConfirmation deleteGroupConfirmation = new DeleteGroupConfirmation(driver,10);
        deleteGroupConfirmation.waitUntilLoaded();
        deleteGroupConfirmation.getDeleteGroupButton().click();
    }

    /**
     * This test may fail if there are no other users outside of the test user on the system.
     * This isn't a failure of the UI but just the nature of this test, a log message will also state this.
     */
    @Test
    public void memberOptionsTest() {
        try {
            groupsPage.getUserOptions().click();
            wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getAddToExistingGroupButton()));
            assertTrue(groupsPage.getAddToExistingGroupButton().isEnabled());
            assertTrue(groupsPage.getAddToNewGroupButton().isEnabled());
            groupsPage.getAddToExistingGroupButton().click();
            AddToExistingGroupPage addToExistingGroupPage = new AddToExistingGroupPage(driver, 10);
            addToExistingGroupPage.waitUntilLoaded();
            assertTrue(addToExistingGroupPage.getAlreadyInGroupsTab().isEnabled());
            assertTrue(addToExistingGroupPage.getAvailableGroupsTab().isEnabled());
            assertTrue(addToExistingGroupPage.getCancelButton().isEnabled());
            assertTrue(addToExistingGroupPage.getSaveButton().isEnabled());
            assertTrue(addToExistingGroupPage.getSearchField().isEnabled());
            assertTrue(addToExistingGroupPage.getSortButton().isEnabled());
            // Switch between tabs, ensure display switches
            addToExistingGroupPage.getAlreadyInGroupsTab().click();
            assertTrue(addToExistingGroupPage.getSortButton().getText().contains("GROUP ASSIGNMENTS"));
            addToExistingGroupPage.getAvailableGroupsTab().click();
            assertTrue(addToExistingGroupPage.getSortButton().getText().contains("NAME"));
            addToExistingGroupPage.getCancelButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(groupsPage.getUserOptions()));
            groupsPage.getUserOptions().click();
            groupsPage.getAddToNewGroupButton().click();
            NewGroupPage newGroupPage = new NewGroupPage(driver, 20);
            newGroupPage.waitUntilLoaded();
            assertTrue(newGroupPage.getCancelButton().isEnabled());
            assertTrue(!newGroupPage.getSaveButton().isEnabled());
            newGroupPage.getGroupNameField().sendKeys("group name");
            assertTrue(newGroupPage.getSaveButton().isEnabled());
        }
        catch (NoSuchElementException noSuchElement) {
            System.out.println("This test requires users other than the test user to exist in the system. A failure of this test in not necessarily a failure of the UI but warrants investigation if multiple users exist.");
        }

    }
}
