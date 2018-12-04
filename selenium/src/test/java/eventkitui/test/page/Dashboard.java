package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * The dashboard page is available from the navigation panel, it is also the default redirect upon login.
 */
public class Dashboard extends LoadablePage {

    @FindBy(className = "qa-DashboardSection-Notifications") private WebElement finalElement;

    public Dashboard(WebDriver driver) {
        super(driver, 10);
    }

    @Override
    public WebElement loadedElement() {
        return finalElement;
    }
}
