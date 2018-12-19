package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class CloneDataPackDialog extends LoadablePage {

    @FindBy(xpath = "//button[contains(@class, 'qa-DataPackOptions-RaisedButton-cloneCancel')]") private WebElement cancelButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-DataPackOptions-RaisedButton-clone')]") private WebElement cloneButton;

    public CloneDataPackDialog(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return cloneButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getCloneButton() {
        return cloneButton;
    }
}
