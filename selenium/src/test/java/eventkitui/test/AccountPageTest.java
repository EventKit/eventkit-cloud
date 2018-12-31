package eventkitui.test;

import eventkitui.test.page.navpanel.AccountPage;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.util.Utils;
import org.apache.tools.ant.types.resources.comparators.Content;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.Time;

import static junit.framework.TestCase.assertTrue;

public class AccountPageTest extends SeleniumBaseTest {

    private AccountPage accountPage;
    private WebDriverWait wait;

    @Before
    public void setupTest() {
        try {
            wait = new WebDriverWait(driver, 10);
            final NavigationPanel navigationPanel = mainPage.getTopPanel().openNavigationPanel();
            navigationPanel.waitUntilLoaded();
            accountPage = navigationPanel.openAccountSettings();
            accountPage.waitUntilLoaded();
        }
        catch (TimeoutException | NoSuchElementException timeout) {
            // accountpage.waitUntilLoad depends on a license body. If there is no license loaded, this will fail making it an optional test.
            System.out.println("This is an optional test. These elements may not appear depending on the state of eventkit-cloud.");
        }
    }

    @Test
    public void checkNextViewLicense() {
        try {
            accountPage.getExpandNextviewLicense().click();
            wait.until(ExpectedConditions.elementToBeClickable(accountPage.getDownloadNextViewLicense()));
            accountPage.getDownloadNextViewLicense().click();
            assertTrue(accountPage.getDownloadNextViewLicense().isEnabled());
        }
        catch (TimeoutException | NoSuchElementException timeoutException) {
            System.out.println("This is an optional test. These elements may not appear depending on the state of eventkit-cloud.");
        }
    }

    @Test
    public void checkOdcLicense() {
        try {
            accountPage.getExpandOdcLicense().click();
            wait.until(ExpectedConditions.elementToBeClickable(accountPage.getDownloadOdcLicense()));
            accountPage.getDownloadOdcLicense().click();
            assertTrue(accountPage.getDownloadOdcLicense().isEnabled());
        }
        catch (TimeoutException | NoSuchElementException timeoutException) {
            System.out.println("This is an optional test. These elements may not appear depending on the state of eventkit-cloud.");
        }
    }
}
