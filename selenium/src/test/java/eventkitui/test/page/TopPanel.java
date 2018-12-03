package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Top panel stretches across eventkit and is always available.
 */
public class TopPanel extends PageObject {

    @FindBy(xpath = "//button[contains(@class, 'jss49 jss43 jss46 qa-Application-AppBar-MenuButton jss4')]")	private WebElement menuButton;
    @FindBy(xpath = "//button[contains(@class, 'jss49 jss43 jss46 qa-Application-AppBar-Notifications jss5')]")	private WebElement notificationsButton;

    public TopPanel(WebDriver driver) {
        super(driver);
    }


}
