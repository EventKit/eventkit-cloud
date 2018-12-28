package eventkitui.test;

import eventkitui.test.page.TopPanel;
import eventkitui.test.page.map.AreaOfInterestWindow;
import eventkitui.test.page.map.BufferAoiWindow;
import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.datapack.*;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.Random;

import static junit.framework.TestCase.assertTrue;

/**
 * Tests UI components for creating data packs.
 */
public class DatapackTest extends SeleniumBaseTest {

    private NavigationPanel navigationPanel;
    private CreationPage creationPage;
    private OpenLayersMap map;

    @Before
    public void dataPackTestSetup() {
        navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        navigationPanel.waitUntilLoaded();
        creationPage = navigationPanel.openCreateDataPack();
        creationPage.waitUntilLoaded();
        map = creationPage.getOpenLayersMap();
    }

    // Large test, will zoom to aoi, draw bounding box, create data pack and check UI elements as it goes through.
    @Test
    public void createDataPackTest() {
        // UI assertions
        assertTrue(map.getDrawBoxButton().isEnabled());
        assertTrue(map.getSearchField().isEnabled());
        assertTrue(map.getSearchButton().isEnabled());
        // Zoom to Washington, D.C. via search field
        map.getSearchField().sendKeys("Washington, D.C.");
        // Clicking search result will open aoi window, search result can take some time
        WebDriverWait wait = new WebDriverWait(driver, 30);
        try {
            wait.until(ExpectedConditions.elementToBeClickable(map.getSearchResult()));
        } catch (TimeoutException timeout) {
            System.out.println("Search results did not load in allotted time.");
            Utils.takeScreenshot(driver);
            throw timeout;
        }
        assertTrue(map.getSearchResult().isEnabled());
        map.getSearchResult().click();
        final AreaOfInterestWindow aoiWindow = new AreaOfInterestWindow(driver, 5);
        aoiWindow.waitUntilLoaded();
        // UI assertions
        if(aoiWindow.isWarningDisplayed(driver)) {
            aoiWindow.getCloseWarningPopup().click();
        }
        assertTrue(aoiWindow.getBufferButton().isEnabled());
        // This will open the buffer input window
        aoiWindow.getBufferButton().click();
        final BufferAoiWindow bufferAoiWindow = new BufferAoiWindow(driver, 5);
        bufferAoiWindow.waitUntilLoaded();
        assertTrue(bufferAoiWindow.getBufferField().isEnabled());
        assertTrue(bufferAoiWindow.getUpdateButton().isEnabled());
        assertTrue(bufferAoiWindow.getCloseButton().isEnabled());
        bufferAoiWindow.getBufferField().sendKeys(String.valueOf(200));
        bufferAoiWindow.getUpdateButton().click();
        aoiWindow.getZoomToButton().click();
        // Closes aoi window
        map.getSearchButton().click();
        try {
            map.getDrawBoxButton().click();
            map.drawBoundingBox();
            // finish box
        }
        catch (InterruptedException interruptedException) {
            // TODO Better logging.
            interruptedException.printStackTrace();
        }
        creationPage.getNextButton().click();
        final CreationDetails details = new CreationDetails(driver, 10);
        details.waitUntilLoaded();
        assertTrue(details.getNameField().isDisplayed());
        assertTrue(details.getDescriptionField().isEnabled());
        assertTrue(details.getProjectField().isEnabled());
        assertTrue(details.getOpenStreetMapDataThemesCheckBox().isEnabled());
        Random random = new Random();
        details.getNameField().sendKeys("Selenium DataPack" + random.nextLong());
        details.getDescriptionField().sendKeys("Selenium description");
        details.getProjectField().sendKeys("Selenium project");
        details.getOpenStreetMapDataThemesCheckBox().click();
        details.getNextButton().click();
        // Finish, allow to finish and delete.
        final PreviewCreationPage previewCreationPage = new PreviewCreationPage(driver, 10);
        previewCreationPage.waitUntilLoaded();
        previewCreationPage.getNextButton().click();
        final StatusAndDownload statusAndDownload = new StatusAndDownload(driver, 10);
        statusAndDownload.waitUntilLoaded();
        assertTrue(statusAndDownload.getDeleteExport().isEnabled());
        assertTrue(statusAndDownload.getCloneExport().isEnabled());
        assertTrue(statusAndDownload.getRerunExport().isEnabled());
        // test clone window
        statusAndDownload.getCloneExport().click();
        CloneDataPackDialog cloneDataPackDialog = new CloneDataPackDialog(driver, 10);
        cloneDataPackDialog.waitUntilLoaded();
        assertTrue(cloneDataPackDialog.getCancelButton().isEnabled());
        assertTrue(cloneDataPackDialog.getCloneButton().isEnabled());
        cloneDataPackDialog.getCancelButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(statusAndDownload.getCloneExport()));
        // Test rerun window
        statusAndDownload.getRerunExport().click();
        RerunDataPackDialog rerunDataPackDialog = new RerunDataPackDialog(driver, 10);
        rerunDataPackDialog.waitUntilLoaded();
        assertTrue(rerunDataPackDialog.getCancelButton().isEnabled());
        assertTrue(rerunDataPackDialog.getRerunButton().isEnabled());
        rerunDataPackDialog.getCancelButton().click();
        wait.until(ExpectedConditions.elementToBeClickable(statusAndDownload.getCloneExport()));
        // Exports can take time
        final WebDriverWait longWait = new WebDriverWait(driver, 1000);
        try {
            longWait.until(ExpectedConditions.elementToBeClickable(statusAndDownload.getDownloadZipButton()));
        }
        catch (NoSuchElementException | TimeoutException noSuchElement) {
            System.out.println("Test failed. This test can be considered an integration test as it actually waits for data to get churned. This test failure may not be an indication of failure on part of the UI but instead may be the system itself failing to complete the job in the allotted time for some reason.");
            throw noSuchElement;
        }
        assertTrue(statusAndDownload.getDownloadZipButton().isDisplayed());
        // Cleanup
        statusAndDownload.getDeleteExport().click();
        final ConfirmDeleteButton confirmDeleteButton = new ConfirmDeleteButton(driver, 10);
        confirmDeleteButton.waitUntilLoaded();
        confirmDeleteButton.getConfirmDeleteButton().click();
    }

    @Test
    public void testImportPage() {
        assertTrue(map.getImportButton().isEnabled());
        map.getImportButton().click();
        final ImportAOI importAOI = new ImportAOI(driver, 10);
        importAOI.waitUntilLoaded();
        assertTrue(importAOI.getSelectFileButton().isEnabled());
    }

    @Test
    public void testCurrentView() {
        assertTrue(map.getCurrentViewButton().isEnabled());
        map.getCurrentViewButton().click();
        AreaOfInterestWindow areaOfInterestWindow = new AreaOfInterestWindow(driver, 10);
        assertTrue(areaOfInterestWindow.getBufferButton().isEnabled());
    }

    @Test
    public void testAreYouSureDialog() {
        TopPanel topPanel = new TopPanel(driver);
        map.getCurrentViewButton().click();
        // Should prompt are you sure dialog
        topPanel.openNavigationPanel().waitUntilLoaded();
        navigationPanel.openDashboard();
        AreYouSure areYouSure = new AreYouSure(driver, 10);
        areYouSure.waitUntilLoaded();
        assertTrue(areYouSure.getConfirmButton().isEnabled());
        areYouSure.getCancelButton().click();
        assertTrue(map.getCurrentViewButton().isEnabled());
        topPanel.openNavigationPanel().waitUntilLoaded();
        navigationPanel.openDashboard();
        areYouSure.waitUntilLoaded();
        assertTrue(areYouSure.getConfirmButton().isEnabled());
        areYouSure.getConfirmButton().click();
        new WebDriverWait(driver, 5).withTimeout(Duration.ofSeconds(5));
        assertTrue(driver.getCurrentUrl().contains("dashboard"));
    }
}
