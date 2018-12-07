package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ConfirmDeleteButton extends LoadablePage {

    public WebElement getConfirmDeleteButton() {
        return confirmDeleteButton;
    }
    // TODO - This should be in its own confirmation page, putting this in here for now to get my test working.
    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-ConfirmButton')]") private WebElement confirmDeleteButton;
    public ConfirmDeleteButton(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return confirmDeleteButton;
    }
}
