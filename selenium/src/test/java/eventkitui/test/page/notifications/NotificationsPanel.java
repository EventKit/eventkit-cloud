package eventkitui.test.page.notifications;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Notifications popup window, accessed by bell icon in top panel
 */
public class NotificationsPanel extends LoadablePage {
    @FindBy(className = "qa-NotificationGridItem") private WebElement notificationItem;
    @FindBy(className = "qa-NotificationsDropdown-Header-MarkAllAsRead") private WebElement markAllAsRead;
    @FindBy(className = "qa-NotificationsDropdown-ViewAll") private WebElement viewAllButton;
    // The following exists on each grid item (three dots)
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationMenu-IconMenu')]") private WebElement moreOptionsButton;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-View')]") private WebElement viewButton;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-MarkAsRead')]") private WebElement markAsRead;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-MarkAsUnread')]") private WebElement markAsUnread;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-Remove')]") private WebElement remove;

    // Notifications area has its own progress bar that varies wildly in load time.
    private By notificationsProgressBar = By.xpath("//div[contains(@role, 'progressbar')]");

    public NotificationsPanel(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return viewAllButton;
    }

    public WebElement getNotificationItem() {
        return notificationItem;
    }

    public WebElement getMarkAllAsRead() {
        return markAllAsRead;
    }

    public WebElement getViewAllButton() {
        return viewAllButton;
    }

    public WebElement getMoreOptionsButton() {
        return moreOptionsButton;
    }

    public WebElement getViewButton() {
        return viewButton;
    }

    public WebElement getMarkAsRead() {
        return markAsRead;
    }

    public WebElement getMarkAsUnread() {
        return markAsUnread;
    }

    public WebElement getRemove() {
        return remove;
    }

    public By getNotificationsProgressBar() { return notificationsProgressBar; }
}
