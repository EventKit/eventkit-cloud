package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class PreviewCreationPage extends LoadablePage {
    @FindBy (className = "qa-CustomTableRow") private WebElement rowField;

    public WebElement getRowField() {
        return rowField;
    }

    public WebElement getNextButton() {
        return nextButton;
    }

    @FindBy(id = "Next") private WebElement nextButton;

    public PreviewCreationPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return rowField;
    }
}
