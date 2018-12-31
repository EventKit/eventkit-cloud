package eventkitui.test;

import eventkitui.test.page.navpanel.*;
import eventkitui.test.page.navpanel.dashboard.Dashboard;
import eventkitui.test.page.navpanel.datapack.CreationPage;
import eventkitui.test.page.navpanel.groups.GroupsPage;
import eventkitui.test.page.navpanel.library.LibraryPage;
import eventkitui.test.util.Info;
import eventkitui.test.util.Utils;
import org.junit.Test;
import org.openqa.selenium.TimeoutException;

import static org.junit.Assert.assertTrue;

public class NavigationPanelTests extends SeleniumBaseTest{

    @Test
    @Info(importance = Info.Importance.HIGH)
    public void openAbout() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        final AboutPage aboutPage = navigationPanel.openAboutPage();
        aboutPage.waitUntilLoaded();
        assertTrue(aboutPage.getParagraphTitle().getText().contains("Overview"));
    }

    @Test
    public void openDashboard() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        final Dashboard dashboard = navigationPanel.openDashboard();
        dashboard.waitUntilLoaded();
        assertTrue(dashboard.getHeader().isDisplayed());
        assertTrue(dashboard.getHeader().getText().contains("Dashboard"));
        assertTrue(driver.getCurrentUrl().contains("dashboard"));
    }

    @Test
    public void openLibrary() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        final LibraryPage libraryPage = navigationPanel.openDataPackLibrary();
        libraryPage.waitUntilLoaded();
        assertTrue(libraryPage.getHeader().isDisplayed());
        assertTrue(libraryPage.getHeader().getText().contains("DataPack Library"));
        assertTrue(driver.getCurrentUrl().contains("exports"));
    }

    @Test
    public void openCreateDataPack() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        final CreationPage creationPage = navigationPanel.openCreateDataPack();
        creationPage.waitUntilLoaded();
        assertTrue(creationPage.getHeader().isDisplayed());
        assertTrue(creationPage.getHeader().getText().contains("Create DataPack"));
        assertTrue(driver.getCurrentUrl().contains("create"));
    }

    @Test
    public void openAccountSettingsPage() {
        try {
            final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
            final AccountPage accountPage = navigationPanel.openAccountSettings();
            accountPage.waitUntilLoaded();
            assertTrue(accountPage.getHeader().isDisplayed());
            assertTrue(accountPage.getHeader().getText().contains("Account"));
            assertTrue(driver.getCurrentUrl().contains("account"));
        }
        catch (TimeoutException timeoutException) {
            System.out.println("This is an optional test. These elements may not appear depending on the state of eventkit-cloud.");
        }
    }

    @Test
    public void openGroupsPage() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        final GroupsPage groupsPage = navigationPanel.openMembersAndGroups();
        groupsPage.waitUntilLoaded();
        assertTrue(groupsPage.getHeader().isDisplayed());
        assertTrue(groupsPage.getHeader().getText().contains("Members and Groups"));
        assertTrue(driver.getCurrentUrl().contains("groups"));
    }

    @Test
    public void contactUsTest() {
        final NavigationPanel navigationPanel = Utils.openNavigationPanel(driver, mainPage);
        // Contact us link is configurable so we don't want to check where it leads us, just that it is clickable.
        assertTrue(navigationPanel.getContactUsLink().isDisplayed());
    }

}
