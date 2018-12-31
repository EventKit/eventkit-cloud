package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class LocalLoginPage extends LoadablePage {

    @FindBy(id = "username") private WebElement usernameField;
    @FindBy(id = "password") private WebElement passwordField;
    @FindBy(name = "submit") private  WebElement loginButton;

    public LocalLoginPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return usernameField;
    }

    public void login(final String username, final String password) {
        usernameField.sendKeys(username);
        passwordField.sendKeys(password);
        loginButton.click();
    }

    public WebElement getUsernameField() {
        return usernameField;
    }

    public WebElement getLoginButton() {
        return loginButton;
    }

    public WebElement getPasswordField() {
        return passwordField;
    }
}
