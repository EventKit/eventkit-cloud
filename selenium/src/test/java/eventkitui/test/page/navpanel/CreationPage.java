package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Content are that appears when create datapack is selected in navigation bar.
 */
public class CreationPage extends ContentPage {

    @FindBy(className = "ol-viewport") private WebElement viewport;

    public CreationPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return viewport;
    }

}
