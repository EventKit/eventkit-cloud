package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ConfirmDeleteButton extends LoadablePage {

    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-ConfirmButton')]") private WebElement confirmDeleteButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-CancelButton')]") private WebElement cancelButton;

    public ConfirmDeleteButton(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return confirmDeleteButton;
    }

    public WebElement getConfirmDeleteButton() {
        return confirmDeleteButton;
    }

    public WebElement getCancelButton() { return cancelButton; }
}
