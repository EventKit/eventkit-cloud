package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import eventkitui.test.page.navpanel.NavigationPanel;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Main page. Eventkit is a single page app.
 *
 */
public class MainPage extends PageObject {

    @FindBy(xpath = "//div[contains(@class, 'qa-LoginForm-oauth')]/button")	private WebElement geoAxisLoginButton;
    @FindBy(className = "qa-LoginPage-disclaimer") private WebElement consentBanner;
    @FindBy(className = "qa-Application-content") private WebElement contentWindow;

    public static final String cookieName = "csrftoken";

    // Top panel, navigation panel, and general content area seem to make up the eventkit UI
    private TopPanel        topPanel;
    private NavigationPanel navigationPanel;
    private WebDriverWait wait;


    public MainPage(WebDriver driver) {
        super(driver);
        topPanel        = new TopPanel(driver);
        navigationPanel = new NavigationPanel(driver, 10);
        wait = new WebDriverWait(driver, 20);
    }

    /**
     * Clicks the Login button at the bottom of the splash page
     *
     * @return The Login Page, where credentials can be entered
     */
    public GxLoginPage beginLogin() {
        wait.until(ExpectedConditions.elementToBeClickable(geoAxisLoginButton));
        geoAxisLoginButton.click();
        return new GxLoginPage(driver);
    }

    /**
     * Gets navigation panel.
     * @return {@link NavigationPanel}
     */
    public NavigationPanel getNavigationPanel() {
        return this.navigationPanel;
    }

    /**
     * Gets top panel.
     * @return {@link TopPanel}
     */
    public TopPanel getTopPanel() {
        return this.topPanel;
    }

}
