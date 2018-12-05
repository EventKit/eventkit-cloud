package eventkitui.test;

import eventkitui.test.page.navpanel.*;
import eventkitui.test.util.Info;
import org.junit.Test;
import org.openqa.selenium.NoSuchElementException;

import static org.junit.Assert.assertTrue;

public class NavigationPanelTests extends SeleniumBaseTest{

    @Test
    @Info(importance = Info.Importance.HIGH)
    public void openAbout() {
        final NavigationPanel navigationPanel = openNavPanel();
        final AboutPage aboutPage = navigationPanel.openAboutPage();
        aboutPage.waitUntilLoaded();
        assertTrue(aboutPage.getParagraphTitle().getText().contains("Overview"));
    }

    @Test
    public void openDashboard() {
        final NavigationPanel navigationPanel = openNavPanel();
        final Dashboard dashboard = navigationPanel.openDashboard();
        dashboard.waitUntilLoaded();
        assertTrue(dashboard.getHeader().isDisplayed());
        assertTrue(dashboard.getHeader().getText().contains("Dashboard"));
    }

    @Test
    public void openLibrary() {
        final NavigationPanel navigationPanel = openNavPanel();
        final LibraryPage libraryPage = navigationPanel.openDataPackLibrary();
        libraryPage.waitUntilLoaded();
        assertTrue(libraryPage.getHeader().isDisplayed());
        assertTrue(libraryPage.getHeader().getText().contains("DataPack Library"));
    }

    @Test
    public void openCreateDataPack() {
        final NavigationPanel navigationPanel = openNavPanel();
        final CreationPage creationPage = navigationPanel.openCreateDataPack();
        creationPage.waitUntilLoaded();
        assertTrue(creationPage.getHeader().isDisplayed());
        assertTrue(creationPage.getHeader().getText().contains("Create DataPack"));
    }

    @Test
    public void openAccountSettingsPage() {
        final NavigationPanel navigationPanel = openNavPanel();
        final AccountPage accountPage = navigationPanel.openAccountSettings();
        assertTrue(accountPage.getHeader().isDisplayed());
        assertTrue(accountPage.getHeader().getText().contains("Account"));
    }

    @Test
    public void openGroupsPage() {
        final NavigationPanel navigationPanel = openNavPanel();
        final GroupsPage groupsPage = navigationPanel.openMembersAndGroups();
        assertTrue(groupsPage.getHeader().isDisplayed());
        assertTrue(groupsPage.getHeader().getText().contains("Members and Groups"));
    }

    @Test
    public void contactUsTest() {
        final NavigationPanel navigationPanel = openNavPanel();
        // Contact us link is configurable so we don't want to check where it leads us, just that it is clickable.
        assertTrue(navigationPanel.getContactUsLink().isDisplayed());
    }

    /**
     * Ensures nav panel is opened.
     */
    private NavigationPanel openNavPanel() {
        final NavigationPanel navigationPanel = new NavigationPanel(driver, 10);
        // Nav panel is sometimes open by default, may depend on your previous state.
        try {
            if(!navigationPanel.isLoaded()) {
                mainPage.getTopPanel().openNavigationPanel();
                navigationPanel.waitUntilLoaded();
            }
        }
        catch (final NoSuchElementException noSuchElement) {
            // panel was not open, element did not exist. Open panel and move on.
            mainPage.getTopPanel().openNavigationPanel();
            navigationPanel.waitUntilLoaded();
        }
        return navigationPanel;
    }
}
