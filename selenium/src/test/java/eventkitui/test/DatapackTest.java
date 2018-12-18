package eventkitui.test;

import eventkitui.test.page.map.AreaOfInterestWindow;
import eventkitui.test.page.map.BufferAoiWindow;
import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.datapack.*;
import eventkitui.test.util.Utils;
import org.junit.Test;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;

/**
 * Tests UI components for creating data packs.
 */
public class DatapackTest extends SeleniumBaseTest {

    private final Logger logger = Logger.getLogger(this.getClass().getName());

    // Large test, will zoom to aoi, draw bounding box, create data pack
    // TODO - Cleanup, more assertions
    @Test
    public void createDataPackTest() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        navigationPanel.waitUntilLoaded();
        final CreationPage creationPage = navigationPanel.openCreateDataPack();
        creationPage.waitUntilLoaded();
        final OpenLayersMap map = creationPage.getOpenLayersMap();
        // Zoom to Washington, D.C. via search field
        map.getSearchField().sendKeys("Washington, D.C.");
        // Clicking search result will open aoi window
        WebDriverWait wait = new WebDriverWait(driver, 5);
        try {
            wait.until(ExpectedConditions.elementToBeClickable(map.getSearchResult()));
        } catch (TimeoutException timeout) {
            Utils.takeScreenshot(driver);
        }
        map.getSearchResult().click();
        final AreaOfInterestWindow aoiWindow = new AreaOfInterestWindow(driver, 5);
        aoiWindow.waitUntilLoaded();
        // This will open the buffer input window
        aoiWindow.getBufferButton().click();
        final BufferAoiWindow bufferAoiWindow = new BufferAoiWindow(driver, 5);
        bufferAoiWindow.waitUntilLoaded();
        bufferAoiWindow.getBufferField().sendKeys(String.valueOf(10));
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
        details.getNameField().sendKeys("Selenium DataPack");
        details.getDescriptionField().sendKeys("Selenium description");
        details.getProjectField().sendKeys("Selenium project");
        details.getOpenStreetMapDataThemesCheckBox().click();
        details.getOpenStreetMapTilesCheckBox().click();
        details.getNextButton().click();
        // Finish, allow to finish and delete.
        final PreviewCreationPage previewCreationPage = new PreviewCreationPage(driver, 10);
        previewCreationPage.waitUntilLoaded();
        previewCreationPage.getNextButton().click();
        final StatusAndDownload statusAndDownload = new StatusAndDownload(driver, 10);
        statusAndDownload.waitUntilLoaded();
        // Exports can take time
        final WebDriverWait longWait = new WebDriverWait(driver, 1000);
        try {
            longWait.until(ExpectedConditions.elementToBeClickable(statusAndDownload.getDownloadZipButton()));
        }
        catch (NoSuchElementException | TimeoutException noSuchElement) {
            System.out.println("Test failed. This test can sometimes be considered an integration test as it actually waits for data to get churned. This test failure may not be an indication of failure on part of the UI but instead may be the system itself failing to complete jobs for some reason.");
            throw noSuchElement;
        }
        assertTrue(statusAndDownload.getDownloadZipButton().isDisplayed());
        // Cleanup
        statusAndDownload.getDeleteExport().click();
        final ConfirmDeleteButton confirmDeleteButton = new ConfirmDeleteButton(driver, 10);
        confirmDeleteButton.waitUntilLoaded();
        confirmDeleteButton.getConfirmDeleteButton().click();
    }
}
