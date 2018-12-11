package eventkitui.test.page.core;

import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Represents the main content area of the screen where different pages are ultimately displayed.
 */
public abstract class LoadablePage extends PageObject {

    @FindBy(xpath = "//div[contains(@class, 'qa-loading-body')]") private WebElement loadingSpinner;


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
        // This loop deals with the loading spinner. The loading spinner is drawn overtop all elements while elements are loading,
        // and will absorb all clicks until it determines the page is finished loading. I'm open to suggestions on a better way to do this,
        // currently this loop determines if the spinner is still displayed or if it has been dismissed at which point a NoSuchElementException is thrown.
        // An element is technically clickable even when the spinner is overtop of it although attempting to do so causes a seleniumexception. Hence this loop.
        while(true) {
            try {
                loadingSpinner.click();
            }
            catch (StaleElementReferenceException seleniumException) {
                continue;
            }
            catch (NoSuchElementException noSuchElement) {
                break;
            }
        }
        wait.until(ExpectedConditions.elementToBeClickable(loadedElement()));
    }

    public boolean isLoaded() {
        return loadedElement().isEnabled();
    }

}
