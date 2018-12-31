package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Import aoi screen.
 */
public class ImportAOI extends LoadablePage {
    @FindBy(xpath = "//button[contains (@class, 'qa-DropZoneDialog-Button-select')]") private WebElement selectFileButton;

    public ImportAOI(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return selectFileButton;
    }

    public WebElement getSelectFileButton() {
        return this.selectFileButton;
    }
}
