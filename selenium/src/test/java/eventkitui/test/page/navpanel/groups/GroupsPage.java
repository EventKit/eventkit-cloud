package eventkitui.test.page.navpanel.groups;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Account settings page.
 */
public class GroupsPage extends ContentPage
{
    @FindBy(xpath = "//div[contains (@class, 'qa-UserGroupsPage-search')]/div/input") private WebElement userSearchBar;
    @FindBy(xpath = "//button[contains (@class, 'qa-UserGroupsPage-Button-create')]") private WebElement newGroupButton;
    @FindBy(xpath = "//div[contains (@class, 'qa-GroupsDrawer-Drawer')]") private WebElement groupsDrawer;
    @FindBy(xpath = "//button[contains (@class, 'qa-UserHeader-sort')]") private WebElement userSort;
    @FindBy(className = "qa-UserRow-name") private WebElement userRow;
    @FindBy(className = "qa-UserGroupsPage-fixedHeader") private WebElement usersAndGroupsHeader;
    @FindBy(xpath = "//button[contains(@class, 'qa-UserGroupsPage-Button-create')]") private WebElement createGroupButton;
    // This item should only be visible when userSort button is clicked. Verifies click functionality of userSort element.
    @FindBy(xpath = "//li[contains(@class, 'qa-UserHeader-MenuItem-sortNewest')]") private WebElement sortByNewest;
    @FindBy(xpath = "//button[contains(@class, 'qa-GroupsDrawer-groupOptions')]") private WebElement groupOptions;
    //These elements will only be visible when the group options button is clicked
    @FindBy(xpath = "//li[contains(@class, 'qa-GroupsDrawer-group-delete')]") private WebElement deleteGroupButton;
    @FindBy(xpath = "//li[contains(@class, 'qa-GroupsDrawer-group-leave')]") private WebElement leaveGroupButton;
    @FindBy(xpath = "//li[contains(@class, 'qa-GroupsDrawer-group-rename')]") private WebElement changeGroupNameButton;
    // User row options, will only appear when other users are in the system
    @FindBy(xpath = "//button[contains(@class, 'qa-UserRow-options')]") private WebElement userOptions;
    @FindBy(xpath = "//li[contains(@class, 'qa-UserRow-MenuItem-editGroups')]") private WebElement addToExistingGroupButton;
    @FindBy(xpath = "//li[contains(@class, 'qa-UserRow-MenuItem-newGroup')]") private WebElement addToNewGroupButton;




    public WebElement getUserSearchBar() {
        return userSearchBar;
    }

    public WebElement getCreateGroupButton() {
        return createGroupButton;
    }

    public WebElement getNewGroupButton() {
        return newGroupButton;
    }

    public WebElement getGroupsDrawer() {
        return groupsDrawer;
    }

    public WebElement getUserSort() {
        return userSort;
    }

    public WebElement getUserRow() {
        return userRow;
    }

    public WebElement getUsersAndGroupsHeader() {
        return usersAndGroupsHeader;
    }

    public WebElement getSortByNewest() {
        return sortByNewest;
    }

    public GroupsPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return userSort;
    }


    public WebElement getGroupOptions() {
        return groupOptions;
    }

    public WebElement getDeleteGroupButton() {
        return deleteGroupButton;
    }

    public WebElement getLeaveGroupButton() { return leaveGroupButton; }

    public WebElement getChangeGroupNameButton() { return changeGroupNameButton; }

    public WebElement getUserOptions() {
        return userOptions;
    }

    public WebElement getAddToExistingGroupButton() {
        return addToExistingGroupButton;
    }

    public WebElement getAddToNewGroupButton() {
        return addToNewGroupButton;
    }

}
