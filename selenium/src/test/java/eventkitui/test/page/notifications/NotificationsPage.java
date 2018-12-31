package eventkitui.test.page.notifications;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class NotificationsPage extends LoadablePage {
    @FindBy(xpath = "//td[contains(@class, 'qa-NotificationsTableItem-TableCell-Content')]") private WebElement notificationCell;
    // May not always be clickable if there are no more to show
    @FindBy(xpath = "//button[contains(@class, 'qa-LoadButtons-RaisedButton-showLess')]") private  WebElement showMoreButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationsTableItem-ActionButtons-View')]") private WebElement viewButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationsTableItem-ActionButtons-MarkAsRead')]") private WebElement markAsReadButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationsTableItem-ActionButtons-MarkAsUnread')]") private WebElement markAsUnreadButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationsTableItem-ActionButtons-Remove')]") private WebElement removeButton;
    // This button appears dynamically depending on if the screen has enough space to display the above elements or not. If not click the notification icon menu.
    @FindBy(xpath = "//button[contains(@class, 'qa-NotificationMenu-IconMenu')]") private WebElement notificationIconMenu;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-View')]") private WebElement viewInMenu;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-MarkAsRead')]") private WebElement markAsReadInMenu;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-MarkAsUnread')]") private WebElement markAsUnreadInMenu;
    @FindBy(xpath = "//li[contains(@class, 'qa-NotificationMenu-MenuItem-Remove')]") private WebElement removeInMenu;


    public NotificationsPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return notificationCell;
    }

    public WebElement getNotificationCell() {
        return notificationCell;
    }

    public WebElement getShowMoreButton() {
        return showMoreButton;
    }

    public WebElement getViewButton() {
        return viewButton;
    }

    public WebElement getMarkAsReadButton() {
        return markAsReadButton;
    }

    public WebElement getMarkAsUnreadButton() {
        return markAsUnreadButton;
    }

    public WebElement getRemoveButton() {
        return removeButton;
    }

    public WebElement getNotificationIconMenu() {
        return notificationIconMenu;
    }

    public WebElement getViewInMenu() {
        return viewInMenu;
    }

    public WebElement getMarkAsReadInMenu() {
        return markAsReadInMenu;
    }

    public WebElement getMarkAsUnreadInMenu() {
        return markAsUnreadInMenu;
    }

    public WebElement getRemoveInMenu() {
        return removeInMenu;
    }
}
