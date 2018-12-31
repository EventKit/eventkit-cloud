package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Logout confirmation when attempting to logout.
 */
public class LogoutConfirmationPage extends LoadablePage {
    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-ConfirmButton')]") private WebElement logoutButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-CancelButton')]")  private WebElement cancelButton;

    public LogoutConfirmationPage(WebDriver driver, final long timeout) {
        super(driver, timeout);
    }

    /**
     * Presses logout button of confirmation dialog.
     */
    public void finalizeLogout() {
        logoutButton.click();
    }

    /**
     * Presses cancel button of the confirmation dialog.
     */
    public void cancelLogout() {
        cancelButton.click();
    }

    @Override
    public WebElement loadedElement() {
        return logoutButton;
    }
}
