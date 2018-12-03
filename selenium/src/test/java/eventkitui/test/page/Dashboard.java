package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import org.openqa.selenium.WebDriver;

/**
 * The dashboard page is available from the navigation panel, it is also the default redirect upon login.
 */
public class Dashboard extends PageObject {
    public Dashboard(WebDriver driver) {
        super(driver);
    }
}
