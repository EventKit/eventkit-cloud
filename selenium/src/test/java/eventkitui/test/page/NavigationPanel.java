package eventkitui.test.page;

import eventkitui.test.page.core.PageObject;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Navigation panel becomes available from top panel's hamburger button and is available on every page.
 */
public class NavigationPanel extends PageObject {

    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[1]/a")	private WebElement dashboardButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[2]/a")	private WebElement dataPackLibraryButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[3]/a")	private WebElement createDataPackButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[4]/a")	private WebElement membersAndGroupsButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[5]/a")	private WebElement aboutButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[6]/a")	private WebElement accountSettingsButton;
    @FindBy(xpath = "//div[contains(@class, 'jss67 qa-Drawer-Drawer')]/div/div/li[7]/a")	private WebElement logoutButton;
    public NavigationPanel(WebDriver driver) {
        super(driver);
    }

}
