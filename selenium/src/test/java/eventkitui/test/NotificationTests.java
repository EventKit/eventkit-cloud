package eventkitui.test;

import eventkitui.test.page.PageTourWindow;
import eventkitui.test.page.notifications.NotificationsPage;
import eventkitui.test.page.notifications.NotificationsPanel;
import eventkitui.test.util.Utils;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static junit.framework.TestCase.assertTrue;

public class NotificationTests extends SeleniumBaseTest {

    private NotificationsPanel notificationsPanel;
    private WebDriverWait wait;

    @Before
    public void openNavigationPanel() {
        notificationsPanel = mainPage.getTopPanel().openNotificationPanel();
        wait = new WebDriverWait(driver, 20);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(notificationsPanel.getNotificationsProgressBar()));
    }

    @Test
    public void testNotificationsPanel() {
        assertTrue(notificationsPanel.getMarkAllAsRead().isEnabled());
        assertTrue(notificationsPanel.getNotificationItem().isEnabled());
        assertTrue(notificationsPanel.getMoreOptionsButton().isEnabled());
    }

    @Test
    public void testMoreOptions() {
        try {
            // Upon initial load, cards don't always appear. Loading bar is not named or identifiable, just wait.
            wait.withTimeout(Duration.ofSeconds(10));
            try {
                notificationsPanel.getMoreOptionsButton().click();
            }
            catch (NoSuchElementException nosuch) {
                Utils.takeScreenshot(driver);
            }
            wait.until(ExpectedConditions.elementToBeClickable(notificationsPanel.getRemove()));
            assertTrue(notificationsPanel.getViewButton().isEnabled());

            try {
                assertTrue(notificationsPanel.getMarkAsRead().isEnabled());
            } catch (NoSuchElementException noSuchElementException) {
                // Mark as read can change to mark as unread
                try {
                    assertTrue(notificationsPanel.getMarkAsUnread().isEnabled());
                } catch (NoSuchElementException stillNoElement) {
                    stillNoElement.printStackTrace();
                    assertTrue(false); // fail test.
                }
            }
            assertTrue(notificationsPanel.getRemove().isEnabled());
        }
        catch (NoSuchElementException noSuchElement) {
            Utils.takeScreenshot(driver);
            throw noSuchElement;
        }
    }

    // This page has a variety of different states that we must account for.
    // Currently I don't know a better way then to simply try to get selenium to find an element,
    // and then catch the exception.
    @Test
    public void testNotificationsPage() {
        notificationsPanel.getViewAllButton().click();
        NotificationsPage notificationsPage = new NotificationsPage(driver, 10);
        notificationsPage.waitUntilLoaded();
        assertTrue(driver.getCurrentUrl().contains("notifications"));
        // If the screen is too small, some buttons are condensed into the notificationIconMenu
        try {
            notificationsPage.getNotificationIconMenu().click();
            try {
                assertTrue(notificationsPage.getMarkAsReadInMenu().isEnabled());
            }
            catch (NoSuchElementException noSuchElementException2) {
                // Mark as read can change to mark as unread
                try {
                    assertTrue(notificationsPage.getMarkAsUnreadInMenu().isEnabled());
                }
                catch (NoSuchElementException stillNoElement) {
                    stillNoElement.printStackTrace();
                    Utils.takeScreenshot(driver);
                    assertTrue(false); // fail test.
                }
            }
            assertTrue(notificationsPage.getRemoveInMenu().isEnabled());
            assertTrue(notificationsPage.getViewInMenu().isEnabled());

        }
        catch (NoSuchElementException noSuchElementException) {
            try {
                assertTrue(notificationsPage.getMarkAsReadButton().isEnabled());
            }
            catch (NoSuchElementException noSuchElementException2) {
                // Mark as read can change to mark as unread
                try {
                    assertTrue(notificationsPage.getMarkAsUnreadButton().isEnabled());
                }
                catch (NoSuchElementException stillNoElement) {
                    stillNoElement.printStackTrace();
                    Utils.takeScreenshot(driver);
                    assertTrue(false); // fail test.
                }
            }

            assertTrue(notificationsPage.getShowMoreButton().isEnabled());
            assertTrue(notificationsPage.getViewButton().isEnabled());
            assertTrue(notificationsPage.getRemoveButton().isEnabled());
        }

    }
}
