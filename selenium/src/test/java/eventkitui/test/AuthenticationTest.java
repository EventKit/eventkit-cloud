package eventkitui.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import eventkitui.test.page.*;
import eventkitui.test.util.Info;
import eventkitui.test.util.Info.Importance;
import eventkitui.test.util.Utils;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestName;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.TimeoutException;
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
    // Dashboard is the default redirect post login.
    private Dashboard dashboard;
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
        WebDriverWait wait = new WebDriverWait(driver, 30);
        Utils.takeScreenshot(driver);
        // Dashboard is default upon login
        wait.until(ExpectedConditions.elementToBeClickable(defaultDashboard.loadedElement()));
        Utils.takeScreenshot(driver);

        final NavigationPanel navigationPanel = mainPage.getTopPanel().openNavigationPanel();
        Utils.takeScreenshot(driver);

        final LogoutConfirmationPage logoutConfirmationPage = navigationPanel.openLogout();
        logoutConfirmationPage.waitUntilLoaded();
        Utils.takeScreenshot(driver);

        logoutConfirmationPage.finalizeLogout();
        Utils.takeScreenshot(driver);


        // Ensure the Cookie has been populated and login was successful
//        Cookie apiKeyCookie = mainPage.getApiKeyCookie();
//        assertNotNull("Login cookie is present", apiKeyCookie);
//        assertTrue("Login cookie is valid GUID",
//                apiKeyCookie.getValue().matches("[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"));
        // TODO - Finish this test via navigation panel
        // Logout. The OAuth is crazy here. Sometimes the provider fulfills the redirect, sometimes it doesn't. So we'll
        // have to check if it has redirected and if so, check the title. If not, we'll at least ensure the cookie was
        // deleted from the session.
//        LogoutPage logoutPage = mainPage.logout();
//        if (mainPage.getCurrentURL().contains("logout")) {
//            assertEquals("Logout text is displayed", logoutPage.getLogoutMessage(), LogoutPage.LOGOUT_MESSAGE);
//        } else {
//            assertTrue("Session closed after logout", mainPage.isLoggedOut());
//        }
    }
}