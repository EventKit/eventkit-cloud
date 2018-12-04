package eventkitui.test;

import eventkitui.test.page.GxLoginPage;
import eventkitui.test.page.MainPage;
import eventkitui.test.util.Utils;
import org.junit.After;
import org.junit.Before;
import org.openqa.selenium.WebDriver;

public class DashboardTest {
    private String BASE_URL = System.getenv("ek_url");
    private String USERNAME = System.getenv("ek_username");
    private String PASSWORD = System.getenv("ek_password");

    private WebDriver driver;
    private MainPage mainPage;

    @Before
    public void setUp() throws Exception {
        driver = Utils.getChromeRemoteDriver();
        mainPage = new MainPage(driver);
        driver.get(BASE_URL);
        // Perform Login
        GxLoginPage loginPage = mainPage.beginLogin();
        mainPage = loginPage.loginDisadvantaged(USERNAME, PASSWORD, mainPage);
    }

    @After
    public void tearDown() {
        driver.quit();
    }


}
