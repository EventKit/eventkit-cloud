package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Account settings page
 */
public class AccountPage extends ContentPage {

    @FindBy(className = "qa-LicenseInfo-body") private WebElement licenseBody;

    public AccountPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return licenseBody;
    }

}
