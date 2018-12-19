package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class RerunDataPackDialog extends LoadablePage {

    @FindBy(xpath = "//button[contains (@class, 'qa-DataPackOptions-Button-rerunCancel')]") private WebElement cancelButton;
    @FindBy(xpath = "//button[contains (@class, 'qa-DataPackOptions-RaisedButton-rerun')]") private WebElement rerunButton;


    public RerunDataPackDialog(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return rerunButton;
    }

    public WebElement getCancelButton() {
        return cancelButton;
    }

    public WebElement getRerunButton() {
        return rerunButton;
    }
}
