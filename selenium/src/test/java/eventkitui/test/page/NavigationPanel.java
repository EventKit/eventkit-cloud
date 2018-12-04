package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Navigation panel becomes available from top panel's hamburger button and is available on every page.
 * Slides out from left side.
 */
public class NavigationPanel extends LoadablePage {

    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[1]/a")	private WebElement dashboardButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[2]/a")	private WebElement dataPackLibraryButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[3]/a")	private WebElement createDataPackButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[4]/a")	private WebElement membersAndGroupsButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[5]/a")	private WebElement aboutButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-Drawer-Drawer')]/div/div/li[6]/a")	private WebElement accountSettingsButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-logout')]")	private WebElement logoutButton;
    public NavigationPanel(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return dashboardButton;
    }

    //TODO - Change these to return an instance of the particular content area once implemented? See openLogout for example
    //TODO - This may not work for sliding panels i.e. navpanel which has state and would only need to return an instance every other click.
    /**
     * Opens the dashboard.
     */
    public void openDashboard() {
        dashboardButton.click();
    }

    /**
     * Opens the datapack library page.
     */
    public void openDataPackLibrary() {
        dataPackLibraryButton.click();
    }

    /**
     * Opens the create datapack page.
     */
    public void openCreateDataPack() {
        createDataPackButton.click();
    }

    /**
     * Opens members and groups page.
     */
    public void openMembersAndGroups() {
        membersAndGroupsButton.click();
    }

    /**
     * Opens about page.
     */
    public void openAboutPage() {
        aboutButton.click();
    }

    /**
     * Opens account settings page.
     */
    public void openAccountSettings() {
        accountSettingsButton.click();
    }

    /**
     * Opens logout confirmation dialog.
     */
    public LogoutConfirmationPage openLogout() {
        logoutButton.click();
        return new LogoutConfirmationPage(driver, 20);
    }
}
