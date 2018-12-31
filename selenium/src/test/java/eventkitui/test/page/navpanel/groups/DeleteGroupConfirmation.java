package eventkitui.test.page.navpanel.groups;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class DeleteGroupConfirmation extends LoadablePage {

    @FindBy(xpath = "//button [contains (@class, 'qa-DeleteGroupDialog-delete')]") private WebElement deleteGroupButton;
    @FindBy(xpath = "//button [contains (@class, 'qa-DeleteGroupDialog-cancel')]") private WebElement cancelGroupButton;

    public DeleteGroupConfirmation(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return deleteGroupButton;
    }

    public WebElement getDeleteGroupButton() {
        return deleteGroupButton;
    }

    public WebElement getCancelGroupButton() {
        return cancelGroupButton;
    }
}
