package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import eventkitui.test.page.core.PageObject;
import eventkitui.test.page.navpanel.NavigationPanel;
import eventkitui.test.page.notifications.NotificationsPanel;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Top panel stretches across eventkit and is always available.
 */
public class TopPanel extends LoadablePage {

    @FindBy(xpath = "//button[contains(@class, 'qa-Application-AppBar-MenuButton')]")	    private WebElement menuButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-Application-AppBar-Notifications')]")	private WebElement notificationsButton;

    public TopPanel(WebDriver driver) {
        super(driver, 20);
    }

    /**
     * Opens the navigation panel.
     * @return {@link NavigationPanel} new navigation panel.
     */
    public NavigationPanel openNavigationPanel() {
        menuButton.click();
        return new NavigationPanel(driver, 15);
    }

    /**
     * Opens the notifications panel
     * @return {@link NotificationsPanel} new notifications panel
     */
    public NotificationsPanel openNotificationPanel() {
        notificationsButton.click();
        NotificationsPanel notificationsPanel = new NotificationsPanel(driver, 10);
        notificationsPanel.waitUntilLoaded();
        return notificationsPanel;
    }

    @Override
    public WebElement loadedElement() {
        return menuButton;
    }
}
