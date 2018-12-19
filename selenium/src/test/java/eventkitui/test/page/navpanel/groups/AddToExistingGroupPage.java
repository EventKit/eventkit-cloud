package eventkitui.test.page.navpanel.groups;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class AddToExistingGroupPage extends LoadablePage {

    @FindBy(xpath = "//button[contains (@class, 'qa-AddMembersDialog-Tab-unassigned')]") private WebElement availableGroupsTab;

    @FindBy(xpath = "//button[contains (@class, 'qa-AddMembersDialog-Tab-assigned')]") private WebElement alreadyInGroupsTab;
    @FindBy(xpath = "//input[contains (@placeholder, 'Search')]") private WebElement searchField;
    @FindBy(xpath = "//button[contains (@class, 'qa-AddMembersDialog-save')]") private WebElement saveButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-AddMembersDialog-cancel')]") private WebElement cancelButton;
    // Check for text, contains: Name - on available groups tab or Group Assignments on already in groups tab.
    @FindBy(xpath = "//button[contains (@class, 'qa-AddMembersDialog-sortName')]") private WebElement sortButton;



    public AddToExistingGroupPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return searchField;
    }

    public WebElement getAvailableGroupsTab() {
        return availableGroupsTab;
    }

    public WebElement getAlreadyInGroupsTab() {
        return alreadyInGroupsTab;
    }

    public WebElement getSearchField() {
        return searchField;
    }

    public WebElement getSaveButton() {
        return saveButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getSortButton() {
        return sortButton;
    }
}
