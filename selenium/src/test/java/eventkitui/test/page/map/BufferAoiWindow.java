package eventkitui.test.page.map;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Input window for buffer AOI.
 */
public class BufferAoiWindow extends LoadablePage {

    @FindBy(name = "buffer-value") private WebElement bufferField;
    @FindBy(xpath = "//button[contains(@class, 'qa-BufferDialog-Button-buffer')]") private WebElement updateButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-BufferDialog-Button-close')]") private WebElement closeButton;

    public WebElement getBufferField() {
        return bufferField;
    }

    public WebElement getUpdateButton() {
        return updateButton;
    }

    public WebElement getCloseButton() {
        return closeButton;
    }

    public BufferAoiWindow(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return updateButton;
    }
}
