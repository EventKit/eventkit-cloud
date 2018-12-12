package eventkitui.test;

import eventkitui.test.page.navpanel.AccountPage;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import static junit.framework.TestCase.assertTrue;

public class AccountPageTest extends SeleniumBaseTest {

    private AccountPage accountPage;
    private WebDriverWait wait;

    @Before
    public void setupTest() {
       wait = new WebDriverWait(driver, 10);
       final NavigationPanel navigationPanel = mainPage.getTopPanel().openNavigationPanel();
       navigationPanel.waitUntilLoaded();
       accountPage = navigationPanel.openAccountSettings();
       accountPage.waitUntilLoaded();
    }

    @Test
    public void checkNextViewLicense() {
        accountPage.getExpandNextviewLicense().click();
        wait.until(ExpectedConditions.elementToBeClickable(accountPage.getDownloadNextViewLicense()));
        accountPage.getDownloadNextViewLicense().click();
        assertTrue(accountPage.getDownloadNextViewLicense().isEnabled());
    }

    @Test
    public void checkOdcLicense() {
        accountPage.getExpandOdcLicense().click();
        wait.until(ExpectedConditions.elementToBeClickable(accountPage.getDownloadOdcLicense()));
        accountPage.getDownloadOdcLicense().click();
        assertTrue(accountPage.getDownloadOdcLicense().isEnabled());
    }
}
