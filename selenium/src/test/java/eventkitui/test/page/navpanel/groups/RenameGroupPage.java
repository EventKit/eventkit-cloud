package eventkitui.test.page.navpanel.groups;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class RenameGroupPage extends LoadablePage {
    @FindBy(xpath = "//input[contains(@placeholder, 'Rename Group')]") private WebElement renameField;
    @FindBy(xpath = "//button[contains(@class, 'qa-RenameGroupDialog-cancel')]") private WebElement cancelButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-RenameGroupDialog-save')]") private WebElement saveButton;

    public RenameGroupPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    public WebElement getRenameField() {
        return renameField;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getSaveButton() {
        return saveButton;
    }

    @Override
    public WebElement loadedElement() {
        return renameField;
    }
}
