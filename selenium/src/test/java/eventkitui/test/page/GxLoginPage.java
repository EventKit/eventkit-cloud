package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import eventkitui.test.page.navpanel.dashboard.Dashboard;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


/**
 * The OAuth-driven Login page, where credentials of various types can be used to authenticate.
 */
public class GxLoginPage extends PageObject {
    /* @formatter:off */
    @FindBy(xpath = "//*[@id='authmechlinks']/div/ul/li[4]/a")		private WebElement disadvantagedLink;
    @FindBy(id = "username")										private WebElement userField;
    @FindBy(id = "password")										private WebElement pwField;
    @FindBy(xpath = "//*[@id='jNotify']/child::a[1]")				private WebElement notificationToContinue;
    @FindBy(css = "input[type=submit]")								private WebElement submitButton;
    /* @formatter:on */

    public GxLoginPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Login with a disadvantaged username and password
     *
     * @param username
     *            The username
     * @param password
     *            The password
     * @param mainPage
     */
    public MainPage loginDisadvantaged(String username, String password, MainPage mainPage) {
        WebDriverWait wait = new WebDriverWait(driver, 20);
        wait.until(ExpectedConditions.elementToBeClickable(disadvantagedLink));
        disadvantagedLink.click();
        userField.sendKeys(username);
        pwField.sendKeys(password);
        submitButton.click();
        wait.until(ExpectedConditions.elementToBeClickable(notificationToContinue));
        notificationToContinue.click();
        return mainPage != null ?mainPage : new MainPage(driver);
    }

}