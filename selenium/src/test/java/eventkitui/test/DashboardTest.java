package eventkitui.test;

import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.dashboard.SharingWindow;
import eventkitui.test.page.navpanel.dashboard.SourcesDialog;
import eventkitui.test.page.navpanel.datapack.ConfirmDeleteButton;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static junit.framework.TestCase.assertTrue;

public class DashboardTest extends SeleniumBaseTest{

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
    public void selectNotificationtBullets() {
        //TODO - Fresh user check
        dashboard.getNotificationCardMenu().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getViewNotification()));
        assertTrue(dashboard.getViewNotification().isEnabled());
        assertTrue(dashboard.getRemoveNotification().isEnabled());
        assertTrue(dashboard.getMarkNotificationRead().isEnabled());
        Utils.takeScreenshot(driver);
    }

    @Test
    public void testRecentlyViewed() {
        //TODO - Fresh user check
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
        assertTrue(dashboard.getShowHideMapButton().isEnabled());
        assertTrue(dashboard.getOpenStatusPage().isEnabled());
        assertTrue(dashboard.getViewProvidersButton().isEnabled());
        assertTrue(dashboard.getDeleteDataPackButton().isEnabled());
        assertTrue(dashboard.getShareDataPackButton().isEnabled());
        // show hide map
        assertTrue(dashboard.getShowHideMapButton().getText().equalsIgnoreCase("Hide Map"));
        dashboard.getShowHideMapButton().click();
        // This item blocks clicking while loading, wait for it to disappear.
        By blockingItem = By.xpath("//li[contains (@class, 'qa-DataPackGridItem-MenuItem-share')]");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(blockingItem));
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getTourDataPackButton()));
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
        assertTrue(dashboard.getShowHideMapButton().getText().equalsIgnoreCase("Show Map"));
    }

    @Test
    public  void testStatusLink() {
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
        dashboard.getOpenStatusPage().click();
        wait.withTimeout(Duration.ofSeconds(10));
        assertTrue(driver.getCurrentUrl().contains("status"));
    }

    @Test
    public void testSourcesDialog() {
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
        dashboard.getViewProvidersButton().click();
        final SourcesDialog sourcesDialog = new SourcesDialog(driver, 10);
        sourcesDialog.waitUntilLoaded();
        assertTrue(sourcesDialog.getCloseButton().isEnabled());
        assertTrue(sourcesDialog.getSourceTitle().isEnabled());
    }

    @Test
    public void testDeleteExportButton() {
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
        dashboard.getDeleteDataPackButton().click();
        final ConfirmDeleteButton confirmDeleteButton = new ConfirmDeleteButton(driver, 10);
        assertTrue(confirmDeleteButton.getConfirmDeleteButton().isEnabled());
        assertTrue(confirmDeleteButton.getCancelButton().isEnabled());
    }

    @Test
    public void testSharingWindow() {
        dashboard.getTourDataPackButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(dashboard.getDeleteDataPackButton()));
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
