package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Main page. Eventkit is a single page app.
 */
public class MainPage extends PageObject {

    @FindBy(xpath = "//div[contains(@class, 'qa-LoginForm-oauth')]/button")	private WebElement geoAxisLoginButton;
    @FindBy(className = "qa-LoginPage-disclaimer") private WebElement consentBanner;
    @FindBy(className = "qa-Application-content") private WebElement contentWindow;
    public MainPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Clicks the Login button at the bottom of the splash page
     *
     * @return The Login Page, where credentials can be entered
     */
    public GxLoginPage beginLogin() {
        geoAxisLoginButton.click();
        return new GxLoginPage(driver);
    }

    /**
     * Gets the Text of the Consent Banner
     *
     * @return Consent banner text
     */
    public String getConsentBannerText() {
        return consentBanner.getText();
    }

    /**
     * Determines if content is loaded.
     *
     * @return {@link WebElement} Main content area.
     */
    public WebElement getContentArea() {
        return contentWindow;
    }

}
