package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * The dashboard page is available from the navigation panel, it is also the default redirect upon login.
 */
public class Dashboard extends ContentPage {

    // TODO / Note - When a fresh user logs in, they will be greeted with a "You don't have any recently viewed DataPacks" and
    // TODO - "You don't have an DataPacks. We will need to handle both cases ( fresh user and previous user) depending on which state test user is in.
    // TODO - qa-DashboardSection-RecentlyViewed-NoData (will need contains xpath) and qa-DashboardSection-MyDataPacks-NoData respectively.

    @FindBy(className = "qa-DashboardSection-Notifications") private WebElement finalElement;
    public Dashboard(WebDriver driver) {
        super(driver, 10);
    }

    @Override
    public WebElement loadedElement() {
        return finalElement;
    }

}
