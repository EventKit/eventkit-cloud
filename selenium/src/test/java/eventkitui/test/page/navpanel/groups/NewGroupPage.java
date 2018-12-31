package eventkitui.test.page.navpanel.groups;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class NewGroupPage extends LoadablePage {

    @FindBy(id = "custom-text-field") private WebElement groupNameField;
    @FindBy(xpath = "//button[contains (@class, 'qa-CreateGroupDialog-save')]") private WebElement saveButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-CreateGroupDialog-cancel')]") private WebElement cancelButton;

    public NewGroupPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return groupNameField;
    }

    public WebElement getGroupNameField() {
        return groupNameField;
    }

    public WebElement getSaveButton() {
        return saveButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }
}
