package eventkitui.test;

import eventkitui.test.page.navpanel.AdminLoginPage;
import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.GxLoginPage;
import eventkitui.test.page.MainPage;
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

public class SeleniumBaseTest {
    protected final String BASE_URL = System.getenv("ek_url");
    protected final String USERNAME = System.getenv("ek_username");
    protected final String PASSWORD = System.getenv("ek_password");

    // Login through gxportal or admin backend
    // TODO change to env variable if we're going to keep this.
    private final boolean adminLogin = false;

    @Rule
    public TestName name = new TestName();

    protected WebDriver driver;
    protected MainPage mainPage;

    @Before
    public void setUp() throws Exception {
        //TODO - A step will need to be created to accept the license for the test user, in the event this is a new instance
        //TODO - or the license was wiped. For now I've gone in and manually accepted the license for this user.
        driver = Utils.getChromeRemoteDriver();
        mainPage = new MainPage(driver);
        driver.get(BASE_URL);
        WebDriverWait wait = new WebDriverWait(driver, 120);
        // Login via admin portal or gxlogin. Likely will remove admin portal after test account is unlocked?
        if(adminLogin) {
            AdminLoginPage adminLoginPage = new AdminLoginPage(driver, 10);
            adminLoginPage.waitUntilLoaded();
            adminLoginPage.login(USERNAME, PASSWORD);
        } else {
            try {
                GxLoginPage gxLoginPage = mainPage.beginLogin();
                mainPage = gxLoginPage.loginDisadvantaged(USERNAME, PASSWORD, mainPage);
            }
            catch(final Exception exception) {
                Utils.takeScreenshot(driver);
                throw new RuntimeException("Something went wrong, see screenshot.");
            }
        }
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
