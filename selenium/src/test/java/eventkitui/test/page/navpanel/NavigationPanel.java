package eventkitui.test.page.navpanel;

import eventkitui.test.page.LogoutConfirmationPage;
import eventkitui.test.page.core.LoadablePage;

import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.navpanel.datapack.CreationPage;
import eventkitui.test.page.navpanel.groups.GroupsPage;
import eventkitui.test.page.navpanel.library.LibraryPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Navigation panel becomes available from top panel's hamburger button and is available on every page.
 * Slides out from left side.
 */
public class NavigationPanel extends LoadablePage {

    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-dashboard')]")private WebElement dashboardButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-exports')]")	private WebElement dataPackLibraryButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-create')]")	private WebElement createDataPackButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-groups')]")	private WebElement membersAndGroupsButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-about')]")	private WebElement aboutButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-account')]")	private WebElement accountSettingsButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-Link-logout')]")	private WebElement logoutButton;
    @FindBy(xpath = "//a[contains(@class, 'qa-Drawer-contact')]")	    private WebElement contactUsLink;

    public NavigationPanel(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return dashboardButton;
    }

    /**
     * Opens the dashboard.
     */
    public Dashboard openDashboard() {
        dashboardButton.click();
        return new Dashboard(driver);
    }

    /**
     * Opens the datapack library page.
     */
    public LibraryPage openDataPackLibrary() {
        dataPackLibraryButton.click();
        return new LibraryPage(driver, 20);
    }

    /**
     * Opens the create datapack page.
     */
    public CreationPage openCreateDataPack() {
        createDataPackButton.click();
        return  new CreationPage(driver, 20);
    }

    /**
     * Opens members and groups page.
     */
    public GroupsPage openMembersAndGroups() {
        membersAndGroupsButton.click();
        return new GroupsPage(driver, 10);
    }

    /**
     * Opens about page.
     */
    public AboutPage openAboutPage() {
        aboutButton.click();
        return new AboutPage(driver, 10);
    }

    /**
     * Opens account settings page.
     */
    public AccountPage openAccountSettings() {
        accountSettingsButton.click();
        return new AccountPage(driver, 10);
    }

    /**
     * Opens logout confirmation dialog.
     */
    public LogoutConfirmationPage openLogout() {
        logoutButton.click();
        return new LogoutConfirmationPage(driver, 20);
    }

    public WebElement getContactUsLink() {
        return contactUsLink;
    }
}
