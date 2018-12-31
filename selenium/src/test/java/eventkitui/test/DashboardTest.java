package eventkitui.test;

import eventkitui.test.page.PageTourWindow;
import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.dashboard.SharingWindow;
import eventkitui.test.page.navpanel.dashboard.SourcesDialog;
import eventkitui.test.page.navpanel.datapack.ConfirmDeleteButton;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.rmi.CORBA.Util;
import java.time.Duration;

import static junit.framework.TestCase.assertTrue;

public class DashboardTest extends SeleniumBaseTest {

    private Dashboard dashboard;
    private WebDriverWait wait;

    @Before
    public void setUpDash() {
        wait = new WebDriverWait(driver, 10);
        NavigationPanel navigationPanel = mainPage.getTopPanel().openNavigationPanel();
        dashboard = navigationPanel.openDashboard();
        dashboard.waitUntilLoaded();
    }

    @Test
    public void selectNotificationBullets() {
        // Cards sometimes take a moment to render.
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getNotificationCardMenu()));
        dashboard.getNotificationCardMenu().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getViewNotification()));
        assertTrue(dashboard.getViewNotification().isEnabled());
        assertTrue(dashboard.getRemoveNotification().isEnabled());
        // Read or unread depending on state
        try {
            assertTrue(dashboard.getMarkNotificationRead().isEnabled());
        }
        catch (NoSuchElementException noSuchElement) {
            assertTrue(dashboard.getMarkNotificationUnread().isEnabled());
        }
    }

    @Test
    public void testRecentlyViewed() {
        // This test is dependent on recently viewed datapacks
        if(Utils.checkIfDisplayed(dashboard.getTourDataPackButton())) {
            dashboard.getTourDataPackButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            assertTrue(dashboard.getShowHideMapButton().isEnabled());
            assertTrue(dashboard.getOpenStatusPage().isEnabled());
            assertTrue(dashboard.getViewProvidersButton().isEnabled());
            try {
                assertTrue(dashboard.getDeleteDataPackButton().isEnabled());
            } catch (NoSuchElementException noSuchElement) {
                // Doesnt have permission to delete this datapack
            }
            try {
                assertTrue(dashboard.getShareDataPackButton().isEnabled());
            } catch (NoSuchElementException noSuchElement) {
                // Doesn't have permission to share this datapack, element will not appear.
            }
            // show hide map
            assertTrue(dashboard.getShowHideMapButton().getText().equalsIgnoreCase("Hide Map"));
            dashboard.getShowHideMapButton().click();
            // This item blocks clicking while loading, wait for it to disappear.
            By blockingItem = By.xpath("//li[contains (@class, 'qa-DataPackGridItem-MenuItem-share')]");
            By blockingItem2 = By.xpath("//li[contains (@class, 'qa-DataPackGridItem-MenuItem-showHideMap')]");
            wait.until(ExpectedConditions.invisibilityOfElementLocated(blockingItem));
            wait.until(ExpectedConditions.invisibilityOfElementLocated(blockingItem2));
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getTourDataPackButton()));
            dashboard.getTourDataPackButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            assertTrue(dashboard.getShowHideMapButton().getText().equalsIgnoreCase("Show Map"));
        }
    }

    @Test
    public  void testStatusLink() {
        try {
            dashboard.getTourDataPackButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            dashboard.getOpenStatusPage().click();
            wait.withTimeout(Duration.ofSeconds(10));
            assertTrue(driver.getCurrentUrl().contains("status"));
        }
        catch (NoSuchElementException noSuch) {
            Utils.takeScreenshot(driver);
        }
    }

    @Test
    public void testSourcesDialog() {
        // This test is dependent on recently viewed datapacks
        if(Utils.checkIfDisplayed(dashboard.getTourDataPackButton())) {
            dashboard.getTourDataPackButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            dashboard.getViewProvidersButton().click();
            final SourcesDialog sourcesDialog = new SourcesDialog(driver, 10);
            sourcesDialog.waitUntilLoaded();
            assertTrue(sourcesDialog.getCloseButton().isEnabled());
        }
    }

    @Test
    // This test is dependent on recently viewed datapacks
    public void testDeleteExportButton() {
        if(Utils.checkIfDisplayed(dashboard.getMyDataPackOptionsButton())) {
            dashboard.getMyDataPackOptionsButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            try {
                dashboard.getDeleteDataPackButton().click();
                final ConfirmDeleteButton confirmDeleteButton = new ConfirmDeleteButton(driver, 10);
                assertTrue(confirmDeleteButton.getConfirmDeleteButton().isEnabled());
                assertTrue(confirmDeleteButton.getCancelButton().isEnabled());
            } catch (NoSuchElementException noSuchElement) {
                System.out.println("Delete is not enabled for selected element.");
            }
        }
    }

    /**
     * Opens sharing window, checks UI elements, changes between group and member tabs,
     * ensures return button returns user to correct view.
     */
    @Test
    public void testSharingWindow() {
        if(Utils.checkIfDisplayed(dashboard.getMyDataPackOptionsButton())) {
            dashboard.getMyDataPackOptionsButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getOpenStatusPage()));
            dashboard.getShareDataPackButton().isDisplayed();
            dashboard.getShareDataPackButton().click();
            final SharingWindow sharingWindow = new SharingWindow(driver, 10);
            sharingWindow.waitUntilLoaded();
            assertTrue(sharingWindow.getGroupsTab().isEnabled());
            assertTrue(sharingWindow.getMembersTab().isEnabled());
            assertTrue(sharingWindow.getSaveButton().isEnabled());
            assertTrue(sharingWindow.getCancelButton().isEnabled());
            sharingWindow.getSharingRightsGroupsButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(sharingWindow.getReturnButton()));
            assertTrue(sharingWindow.getReturnButton().isEnabled());
            assertTrue(sharingWindow.getReturnButton().getText().contains("Return to groups"));
            sharingWindow.getReturnButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(sharingWindow.getGroupsTab()));
            sharingWindow.getMembersTab().click();
            wait.until(ExpectedConditions.elementToBeClickable(sharingWindow.getSharingRightsMembersButton()));
            sharingWindow.getSharingRightsMembersButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(sharingWindow.getReturnButton()));
            assertTrue(sharingWindow.getReturnButton().isEnabled());
            assertTrue(sharingWindow.getReturnButton().getText().contains("Return to members"));
            sharingWindow.getReturnButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(sharingWindow.getGroupsTab()));
            assertTrue(sharingWindow.getGroupsTab().isEnabled());
        }
    }

    // Tests page tour functionality.
    @Test
    public void testPageTour() {
        dashboard.getPageTourButton().click();
        PageTourWindow pageTourWindow = new PageTourWindow(driver, 10);
        pageTourWindow.waitUntilLoaded();
        assertTrue(pageTourWindow.getCloseButton().isEnabled());
        int[] indexes  = Utils.parseTourLabel(pageTourWindow.getPrimaryButton().getText());
        if (indexes != null) {
            assertTrue(indexes != null);
            // Test next and back functionality.
            pageTourWindow.getPrimaryButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(pageTourWindow.getPrimaryButton()));
            int[] indexes2 = Utils.parseTourLabel(pageTourWindow.getPrimaryButton().getText());
            assertTrue(indexes[0] == indexes2[0] - 1);
            assertTrue(pageTourWindow.getSecondaryButton().isEnabled());
            pageTourWindow.getSecondaryButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(pageTourWindow.getPrimaryButton()));
            for (int i = indexes[0]; i < indexes[1]; i++) {
                int[] previousIndexes = Utils.parseTourLabel(pageTourWindow.getPrimaryButton().getText());
                pageTourWindow.getPrimaryButton().click();
                wait.until(ExpectedConditions.elementToBeClickable(pageTourWindow.getPrimaryButton()));
                indexes2 = Utils.parseTourLabel(pageTourWindow.getPrimaryButton().getText());
                if (indexes2 != null) {
                    assertTrue(previousIndexes[0] == indexes2[0] - 1);
                    assertTrue(pageTourWindow.getSecondaryButton().isEnabled());
                }
                else {
                    pageTourWindow.getCloseButton().click();
                }
            }
        }
    }

    @Test
    public void testMyDataPackButton() {
        try {
            assertTrue(dashboard.getMyDataPackOptionsButton().isEnabled());
            dashboard.getMyDataPackOptionsButton().click();
            wait.until(ExpectedConditions.elementToBeClickable(dashboard.getShareDataPackButton()));
            assertTrue((dashboard.getShareDataPackButton().isEnabled()));
        }
        catch (NoSuchElementException noSuchElement) {
            System.out.println("No such element found, no datapacks belong to this user.");
            Utils.takeScreenshot(driver);
        }
    }
}
