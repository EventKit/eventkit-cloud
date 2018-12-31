package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * This page can be used to login when the gx portal is down or the account is locked out..
 *
 */
public class AdminLoginPage extends LoadablePage {
    @FindBy(id = "id_username") private WebElement usernameField;
    @FindBy(id = "id_password") private WebElement passwordField;
    @FindBy(xpath = "//div[contains (@class, 'submit-row')]/input") private WebElement submit;
    // Link to the application dashboard.
    @FindBy(xpath = "//div[contains(@id, 'user-tools')]/a") private WebElement applicationLink;

    public AdminLoginPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    public void login(final String username, final String password) {
        usernameField.sendKeys(username);
        passwordField.sendKeys(password);
        submit.click();
        final WebDriverWait wait = new WebDriverWait(driver, 5);
        wait.until(ExpectedConditions.elementToBeClickable(applicationLink));
        applicationLink.click();
    }

    @Override
    public WebElement loadedElement() {
        return usernameField;
    }
}
