package eventkitui.test;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import eventkitui.test.page.*;
import eventkitui.test.page.navpanel.Dashboard;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.util.Info;
import eventkitui.test.util.Info.Importance;
import eventkitui.test.util.Utils;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestName;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


/**
 * Tests Login and Logout functionality
 */
public class AuthenticationTest {
    private final String BASE_URL = System.getenv("ek_url");
    private final String USERNAME = System.getenv("ek_username");
    private final String PASSWORD = System.getenv("ek_password");

    @Rule
    public TestName name = new TestName();

    private WebDriver driver;
    // Main page, event kit is a one page application.
    private MainPage mainPage;

    @Before
    public void setUp() throws Exception {
        //TODO - A step will need to be created to accept the license for the test user, in the event this is a new instance
        //TODO - or the license was wiped. For now I've gone in and manually accepted the license for this user.
        driver = Utils.getChromeRemoteDriver();
        mainPage = new MainPage(driver);
        driver.get(BASE_URL);
    }

    @After
    public void tearDown() throws Exception {
        driver.quit();
    }

    @Test
    @Info(importance = Importance.HIGH)
    /**
     * This test will login to eventkit via geoxportal,
     * wait for the default dashboard to appear, open the navigation panel, and logout of the system.
     */
    public void standardLoginLogout() throws InterruptedException {
        // Check that the consent banner is present and contains "Consent".
        assertTrue("Consent banner should contain 'consent' text", mainPage.getConsentBannerText().toUpperCase().contains("CONSENT"));
        // Login via Disadvantaged
        GxLoginPage gxLoginPage = mainPage.beginLogin();
        mainPage = gxLoginPage.loginDisadvantaged(USERNAME, PASSWORD, mainPage);
        Dashboard defaultDashboard = new Dashboard(driver);
        // Logging in can take a long time depending on the load on the server it seems.
        WebDriverWait wait = new WebDriverWait(driver, 120);
        // Dashboard is default upon login
        wait.until(ExpectedConditions.elementToBeClickable(defaultDashboard.loadedElement()));

        // Ensure the Cookie has been populated and login was successful
        Cookie apiKeyCookie = mainPage.getApiKeyCookie();
        assertNotNull("Login cookie is present", apiKeyCookie);

        final NavigationPanel navigationPanel = new NavigationPanel(driver, 10);
        // Nav panel is sometimes open by default, may depend on your previous state.
        try {
            if(!navigationPanel.isLoaded()) {
                mainPage.getTopPanel().openNavigationPanel();
                navigationPanel.waitUntilLoaded();
            }
        }
        catch (final NoSuchElementException noSuchElement) {
            // panel was not open, element did not exist. move on. Open panel and move on.
            mainPage.getTopPanel().openNavigationPanel();
            navigationPanel.waitUntilLoaded();
        }

        final LogoutConfirmationPage logoutConfirmationPage = navigationPanel.openLogout();
        logoutConfirmationPage.waitUntilLoaded();
        logoutConfirmationPage.finalizeLogout();


        // Should be back at login page.
        wait.until(ExpectedConditions.urlContains("login"));
        assertTrue(driver.getCurrentUrl().contains("login"));
    }
}