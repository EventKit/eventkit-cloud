package eventkitui.test.page.core;

import org.openqa.selenium.*;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Represents the main content area of the screen where different pages are ultimately displayed.
 */
public abstract class LoadablePage extends PageObject {

    By loadingSpinner = By.xpath("//div[contains(@class, 'qa-loading-body')]");

    private final WebDriverWait wait;

    public LoadablePage(WebDriver driver, final long timeout) {
        super(driver);
        wait = new WebDriverWait(driver, timeout);
    }

    /**
     * Represents a {@link WebElement} that exists after a page has fully loaded.
     *
     * @return {@link WebElement} Element that exists after page has fully loaded.
     *                            This element can be checked for before continuing.
     */
    public abstract WebElement loadedElement();

    /**
     * Waits given timeout until loadedElement is clickable.
     */
    public void waitUntilLoaded() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingSpinner));
        wait.until(ExpectedConditions.elementToBeClickable(loadedElement()));
    }

    public boolean isLoaded() {
        return loadedElement().isEnabled();
    }

}
