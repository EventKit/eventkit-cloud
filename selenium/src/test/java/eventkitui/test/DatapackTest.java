package eventkitui.test;

import eventkitui.test.page.map.AreaOfInterestWindow;
import eventkitui.test.page.map.BufferAoiWindow;
import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.page.navpanel.datapack.*;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.util.Utils;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Point;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.awt.geom.Point2D;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;

/**
 * Tests UI components for creating data packs.
 */
public class DatapackTest extends SeleniumBaseTest {

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
            // give some time for map to load, mainly for my screenshots
            map.getDrawBoxButton().click();
            map.drawBoundingBox();
            // finish box
            // Let map load for my screenshot
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
        longWait.until(ExpectedConditions.elementToBeClickable(statusAndDownload.getDownloadZipButton()));
        assertTrue(statusAndDownload.getDownloadZipButton().isDisplayed());
        Utils.takeScreenshot(driver);
        // Cleanup
        statusAndDownload.getDeleteExport().click();
        Utils.takeScreenshot(driver);
        final ConfirmDeleteButton confirmDeleteButton = new ConfirmDeleteButton(driver, 10);
        confirmDeleteButton.waitUntilLoaded();
        confirmDeleteButton.getConfirmDeleteButton().click();
    }
}
