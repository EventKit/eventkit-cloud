package eventkitui.test.page.map;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Popup window when selecting an AOI
 */
public class AreaOfInterestWindow extends LoadablePage {
    @FindBy(className = "qa-AoiInfobar-title") private WebElement header;
    @FindBy(xpath = "//button[contains(@class, 'qa-AoiInfobar-buffer-button')]") private WebElement bufferButton;
    @FindBy(className = "qa-AoiInfobar-button-zoom") private WebElement zoomToButton;
    @FindBy(className = "qa-AoiInfobar-button-revert") private WebElement revertButton;
    @FindBy(xpath = "//*[name()='svg'][contains (@class, 'qa-AlertCallout-alert-close')]") private WebElement closeWarningPopup;

    public WebElement getHeader() {
        return header;
    }

    public WebElement getBufferButton() {
        return bufferButton;
    }

    public WebElement getZoomToButton() {
        return zoomToButton;
    }

    public WebElement getRevertButton() {
        return revertButton;
    }

    public WebElement getCloseWarningPopup() { return closeWarningPopup; }

    public boolean isWarningDisplayed(WebDriver driver) {
        WebDriverWait wait = new WebDriverWait(driver, 10);
        try {
            wait.until(ExpectedConditions.elementToBeClickable(closeWarningPopup));
            return closeWarningPopup.isDisplayed();
        }
        catch (NoSuchElementException | TimeoutException noSuchElement) {
            return false;
        }
    }



    public AreaOfInterestWindow(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return bufferButton;
    }
}
