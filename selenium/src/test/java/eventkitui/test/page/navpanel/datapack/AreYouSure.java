package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

// Appears if you start creating a datapack and then move away
public class AreYouSure extends LoadablePage {

    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-CancelButton')]") private WebElement cancelButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-ConfirmDialog-Button-ConfirmButton')]") private WebElement confirmButton;

    public AreYouSure(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return confirmButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getConfirmButton() {
        return confirmButton;
    }

}
