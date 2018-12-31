package eventkitui.test.util;

import eventkitui.test.page.MainPage;
import eventkitui.test.page.core.PageObject;
import eventkitui.test.page.map.AreaOfInterestWindow;
import eventkitui.test.page.map.BufferAoiWindow;
import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.navpanel.datapack.CreationDetails;
import eventkitui.test.page.navpanel.datapack.CreationPage;
import eventkitui.test.page.navpanel.datapack.PreviewCreationPage;
import eventkitui.test.page.navpanel.datapack.StatusAndDownload;
import eventkitui.test.page.notifications.NotificationsPanel;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static junit.framework.TestCase.assertTrue;

/**
 * This class will handle the special cases of first time user login.
 * Will accept some licenses and create an initial datapack to get some notifications etc. in the system to test.
 */
public class FirstTimeLogin extends PageObject {
    // This element appearing on login tells us we should accept the licenses.
    @FindBy(xpath = "//div[contains(@class, 'qa-Warning-text')]") private WebElement warningBanner;
    @FindBy(xpath = "//span[contains(@class, 'qa-LicenseInfo-Checkbox')]") private WebElement acceptAllCheckbox;
    @FindBy(xpath = "//button[contains(@class, 'qa-SaveButton-Button-SaveChanges')]") private WebElement saveChangesButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-DashboardSection-Notifications-NoData')]") private WebElement noDataBanner;

    private WebDriverWait wait;
    private WebDriver driver;
    private MainPage mainPage;

    public FirstTimeLogin(final WebDriver driver, MainPage mainPage) {
        super(driver);
        this.driver = driver;
        this.mainPage = mainPage;
        this.wait = new WebDriverWait(driver, 10);
    }

    /**
     * Checks if the license warning is displayed. If so, we must accept the license and create some datapacks for first time use.
     */
    public void firstTimeSeleniumUserSetup() {
        // licenses
        try {
            warningBanner.isEnabled();
            acceptLicenses();
        }
        catch (NoSuchElementException noSuchElementException) {
            // Page didn't load, license must already by accepted or none appeared.
        }
        // No data banner initially appears then goes away. Give time for notifications to load.
        wait.withTimeout(Duration.ofSeconds(10));
        try {
            wait.until(ExpectedConditions.elementToBeClickable(noDataBanner));
            NavigationPanel navigationPanel = mainPage.getTopPanel().openNavigationPanel();
            navigationPanel.waitUntilLoaded();
            CreationPage creationPage = navigationPanel.openCreateDataPack();
            creationPage.waitUntilLoaded();
            createFirstDataPack(creationPage);
            navigationPanel.openDashboard().waitUntilLoaded();
        }
        catch (NoSuchElementException | TimeoutException noSuchElement) {
            // Move on, data already in system.
        }
    }

    public void acceptLicenses() {
        acceptAllCheckbox.click();
        wait.withTimeout(Duration.ofSeconds(5));
        saveChangesButton.click();
    }

    public void createFirstDataPack(CreationPage creationPage) {
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
        if(aoiWindow.isWarningDisplayed(driver)) {
            aoiWindow.getCloseWarningPopup().click();
        }
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
        details.getNameField().sendKeys("Selenium First Login DataPack");
        details.getDescriptionField().sendKeys("Selenium datapack, created for test user.");
        details.getProjectField().sendKeys("Selenium project");
        details.getOpenStreetMapDataThemesCheckBox().click();
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
            System.out.println("Datapack is stalled or still processing. Notifications and such should appear anyway.");
        }
    }

}
