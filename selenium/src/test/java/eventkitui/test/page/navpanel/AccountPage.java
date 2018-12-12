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
    // For some reason selenium couldnt find the second button when attempting to reference as a button directly.
    @FindBy(xpath="//div[contains (@class, 'qa-UserLicense-Card')]/div/div/span/div/button") private WebElement expandNextviewLicense;
    @FindBy(xpath="//div[contains (@class, 'qa-UserLicense-Card')][2]/div/div/span/div/button") private WebElement expandOdcLicense;
    @FindBy(xpath="//a[contains (@href, '/api/licenses/nextview/download')]") private WebElement downloadNextViewLicense;
    @FindBy(xpath="//a[contains (@href, '/api/licenses/odbl/download')]") private WebElement downloadOdcLicense;

    public WebElement getLicenseBody() {
        return licenseBody;
    }

    public WebElement getExpandNextviewLicense() {
        return expandNextviewLicense;
    }

    public WebElement getExpandOdcLicense() {
        return expandOdcLicense;
    }

    public WebElement getDownloadNextViewLicense() {
        return downloadNextViewLicense;
    }

    public WebElement getDownloadOdcLicense() {
        return downloadOdcLicense;
    }



    public AccountPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return licenseBody;
    }

}
