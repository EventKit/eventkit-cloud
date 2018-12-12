package eventkitui.test.page.navpanel.dashboard;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SharingWindow extends LoadablePage {

    @FindBy(xpath = "//button[contains (@class, 'qa-DataPackShareDialog-Button-groups')]") private WebElement groupsTab;
    @FindBy(xpath = "//button[contains (@class, 'qa-DataPackShareDialog-Button-members')]") private WebElement membersTab;
    @FindBy(xpath = "//button[contains (@class, 'qa-GroupsBody-shareInfo-button')]") private WebElement sharingRightsGroupsButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-MembersBody-shareInfo-button')]") private WebElement sharingRightsMembersButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-ShareBaseDialog-save')]") private WebElement saveButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-ShareBaseDialog-cancel')]") private WebElement cancelButton;
    // The following elements appear in the sharing rights info view for groups and members respectively.
    // Will have 'Return to groups' as text or 'Return to members' based on previous view.
    @FindBy(xpath = "//button[contains (@class, 'qa-ShareInfoBody-ButtonBase-return')]") private WebElement returnButton;


    public SharingWindow(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return getGroupsTab();
    }

    public WebElement getGroupsTab() {
        return groupsTab;
    }

    public WebElement getMembersTab() {
        return membersTab;
    }

    public WebElement getSharingRightsGroupsButton() {
        return sharingRightsGroupsButton;
    }

    public WebElement getSharingRightsMembersButton() {
        return sharingRightsMembersButton;
    }

    public WebElement getSaveButton() {
        return saveButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getReturnButton() {
        return returnButton;
    }

}
