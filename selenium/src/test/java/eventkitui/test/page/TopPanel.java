package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Top panel stretches across eventkit and is always available.
 */
public class TopPanel extends PageObject {

    @FindBy(xpath = "//button[contains(@class, 'qa-Application-AppBar-MenuButton')]")	    private WebElement menuButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-Application-AppBar-Notifications')]")	private WebElement notificationsButton;

    public TopPanel(WebDriver driver) {
        super(driver);
    }

    /**
     * Opens the navigation panel.
     * @return {@link NavigationPanel} new navigation panel.
     */
    public NavigationPanel openNavigationPanel() {
        menuButton.click();
        return new NavigationPanel(driver);
    }

}
