package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Backdoor login page
 * /api/login
 */
public class BackdoorLoginPage extends LoadablePage {

    @FindBy(id = "id_username") private WebElement usernameField;
    @FindBy(id = "id_password") private WebElement passwordField;
    @FindBy(id = "submit-id-submit") private WebElement submitButton;

    public BackdoorLoginPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    /**
     * Logs in.
     * @param username
     * @param password
     */
    public void login(final String username, final String password) {
        usernameField.sendKeys(username);
        passwordField.sendKeys(password);
        submitButton.click();
    }

    public WebElement getUsernameField() {
        return usernameField;
    }

    public WebElement getPasswordField() {
        return passwordField;
    }

    public WebElement getSubmitButton() {
        return submitButton;
    }

    @Override
    public WebElement loadedElement() {
        return usernameField;
    }
}
