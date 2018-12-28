package eventkitui.test;

import eventkitui.test.page.BackdoorLoginPage;
import eventkitui.test.page.LocalLoginPage;
import eventkitui.test.page.navpanel.AdminLoginPage;
import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.GxLoginPage;
import eventkitui.test.page.MainPage;
import eventkitui.test.util.FirstTimeLogin;
import eventkitui.test.util.Utils;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestName;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.print.attribute.standard.OutputDeviceAssigned;

public class SeleniumBaseTest {
    protected final String BASE_URL = System.getenv("ek_url");
    protected final String USERNAME = System.getenv("ek_username");
    protected final String PASSWORD = System.getenv("ek_password");

    @Rule
    public TestName name = new TestName();

    protected WebDriver driver;
    protected MainPage mainPage;

    @Before
    public void setUp() throws Exception {
        driver = Utils.getChromeRemoteDriver();
        mainPage = new MainPage(driver);
        driver.get(BASE_URL);
        WebDriverWait wait = new WebDriverWait(driver, 120);
        LocalLoginPage localLoginPage = new LocalLoginPage(driver, 20);
        // will attempt local login first then gx login.
        try {
            localLoginPage.waitUntilLoaded();
            localLoginPage.login(USERNAME, PASSWORD);
        }
        catch (final Exception exception) {
            // try other login methods
            try {
                BackdoorLoginPage backdoorLoginPage =  new BackdoorLoginPage(driver, 10);
                backdoorLoginPage.waitUntilLoaded();
                backdoorLoginPage.login(USERNAME, PASSWORD);
            }
            catch (final Exception loginException) {
                // finally try gxlogin.
                try {
                    GxLoginPage gxLoginPage = mainPage.beginLogin();
                    mainPage = gxLoginPage.loginDisadvantaged(USERNAME, PASSWORD, mainPage);
                }
                catch(final Exception exception2) {
                    Utils.takeScreenshot(driver);
                    throw new RuntimeException("Something went wrong, see screenshot.");
                }
            }
        }

        mainPage.getTopPanel().waitUntilLoaded();
        // Does first time checks, will set stuff up if user has never logged in before.
        FirstTimeLogin firstTimeLogin = new FirstTimeLogin(driver, mainPage);
        firstTimeLogin.firstTimeSeleniumUserSetup();
        Dashboard defaultDashboard = new Dashboard(driver);
        // Logging in can take a long time depending on the load on the server it seems.
        // Dashboard is default upon login
        try {
            wait.until(ExpectedConditions.elementToBeClickable(defaultDashboard.loadedElement()));
        }
        catch (TimeoutException timeoutException) {
            Utils.takeScreenshot(driver);
        }
    }

    @After
    public void tearDown() throws Exception {
        driver.quit();
    }
}
