package eventkitui.test.page.navpanel.dashboard;

import eventkitui.test.page.core.ContentPage;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * The dashboard page is available from the navigation panel, it is also the default redirect upon login.
 */
public class Dashboard extends ContentPage {

    // Appears on a notification card.
    @FindBy(xpath="//button[contains (@class, 'qa-NotificationMenu-IconMenu')]") private WebElement notificationCardMenu;
    @FindBy(xpath = "//li[contains (@class, 'qa-NotificationMenu-MenuItem-View')]") private WebElement viewNotification;
    @FindBy(xpath = "//li[contains (@class, 'qa-NotificationMenu-MenuItem-MarkAsRead')]") private WebElement markNotificationRead;
    @FindBy(xpath = "//li[contains (@class, 'qa-NotificationMenu-MenuItem-MarkAsUnread')]") private WebElement markNotificationUnread;

    @FindBy(xpath = "//li[contains (@class, 'qa-NotificationMenu-MenuItem-Remove')]") private WebElement removeNotification;

    // Appears on a datapack card.
    @FindBy(xpath = "//button[contains (@class, 'tour-datapack-options')]") private WebElement tourDataPackButton;
    @FindBy(xpath = "//li[contains (@class, 'qa-DataPackGridItem-MenuItem-showHideMap')]") private WebElement showHideMapButton;
    @FindBy(xpath = "//li[contains (@class, 'qa-DataPackGridItem-MenuItem-goToStatus')]") private WebElement openStatusPage;
    @FindBy(xpath = "//li[contains (@class, 'qa-DataPackGridItem-MenuItem-viewProviders')]") private WebElement viewProvidersButton;
    @FindBy(xpath = "//li[contains (@class, 'qa-DataPackGridItem-MenuItem-delete')]") private WebElement deleteDataPackButton;
    @FindBy(xpath = "//li[contains (@class, 'qa-DataPackGridItem-MenuItem-share')]") private WebElement shareDataPackButton;
    @FindBy(className = "qa-DashboardSection-Notifications") private WebElement finalElement;
    @FindBy(className = "qa-BaseDialog-div") private WebElement dialogElement;
    // Not a good way to determine if the canvas will actually disappear since selenium would just pickup the canvas from another card. Probably best to check the text of the hide/show button
    @FindBy(xpath="//div[contains (@class, 'qa-DataPackGridItem-CardMedia')]/div/div/canvas") private WebElement dataPackCanvas;

    // The following elements belong to the my datapack section. This will always ensure we have the proper permissions to test share and delete functionality.
    @FindBy(xpath = "//div[contains(@id, 'DashboardSectionMy DataPacks')]/div/div[contains(@class, 'react-swipeable-view-container')]/div/ul/div/div/div/div/div/span/div/button") private WebElement myDataPackOptionsButton;

    public Dashboard(WebDriver driver) {
        super(driver, 20);
    }

    @Override
    public WebElement loadedElement() {
        return finalElement;
    }

    public WebElement getNotificationCardMenu() {
        return notificationCardMenu;
    }

    public WebElement getViewNotification() {
        return viewNotification;
    }

    public WebElement getMarkNotificationRead() {
        return markNotificationRead;
    }

    public WebElement getRemoveNotification() {
        return removeNotification;
    }

    public WebElement getTourDataPackButton() {
        return tourDataPackButton;
    }

    public WebElement getShowHideMapButton() {
        return showHideMapButton;
    }

    public WebElement getOpenStatusPage() {
        return openStatusPage;
    }

    public WebElement getViewProvidersButton() {
        return viewProvidersButton;
    }

    public WebElement getDeleteDataPackButton() {
        return deleteDataPackButton;
    }

    public WebElement getShareDataPackButton() {
        return shareDataPackButton;
    }

    public WebElement getMarkNotificationUnread() { return markNotificationUnread; }

    public WebElement getFinalElement() {
        return finalElement;
    }

    public WebElement getDataPackCanvas() {
        return dataPackCanvas;
    }

    public WebElement getDialogElement() {
        return dialogElement;
    }

    public WebElement getMyDataPackOptionsButton() { return myDataPackOptionsButton; }

}
