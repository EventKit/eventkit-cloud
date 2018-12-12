package eventkitui.test.page.navpanel.dashboard;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SourcesDialog extends LoadablePage {

    @FindBy(xpath = "//li[contains (@class, 'qa-DropDownListItem-title')]") private WebElement sourceTitle;
    @FindBy(xpath = "//button[contains (@class, 'qa-BaseDialog-Button')]") private WebElement closeButton;

    public SourcesDialog(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return closeButton;
    }

    public WebElement getSourceTitle() {
        return sourceTitle;
    }

    public WebElement getCloseButton() {
        return closeButton;
    }

}
