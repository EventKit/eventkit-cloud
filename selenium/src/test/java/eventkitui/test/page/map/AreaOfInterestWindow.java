package eventkitui.test.page.map;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Popup window when selecting an AOI
 */
public class AreaOfInterestWindow extends LoadablePage {
    @FindBy(className = "qa-AoiInfobar-title") private WebElement header;
    @FindBy(xpath = "//button[contains(@class, 'qa-AoiInfobar-buffer-button')]") private WebElement bufferButton;
    @FindBy(className = "qa-AoiInfobar-button-zoom") private WebElement zoomToButton;
    @FindBy(className = "qa-AoiInfobar-button-revert") private WebElement revertButton;

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



    public AreaOfInterestWindow(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return bufferButton;
    }
}
