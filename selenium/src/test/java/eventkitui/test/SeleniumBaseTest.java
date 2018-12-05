package eventkitui.test;

import eventkitui.test.page.navpanel.Dashboard;
import eventkitui.test.page.GxLoginPage;
import eventkitui.test.page.MainPage;
import eventkitui.test.util.Utils;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TestName;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

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
        //TODO - A step will need to be created to accept the license for the test user, in the event this is a new instance
        //TODO - or the license was wiped. For now I've gone in and manually accepted the license for this user.
        driver = Utils.getChromeRemoteDriver();
        mainPage = new MainPage(driver);
        driver.get(BASE_URL);
        // Login via Disadvantaged
        GxLoginPage gxLoginPage = mainPage.beginLogin();
        mainPage = gxLoginPage.loginDisadvantaged(USERNAME, PASSWORD, mainPage);
        Dashboard defaultDashboard = new Dashboard(driver);
        // Logging in can take a long time depending on the load on the server it seems.
        WebDriverWait wait = new WebDriverWait(driver, 120);
        // Dashboard is default upon login
        wait.until(ExpectedConditions.elementToBeClickable(defaultDashboard.loadedElement()));
    }

    @After
    public void tearDown() throws Exception {
        driver.quit();
    }
}
