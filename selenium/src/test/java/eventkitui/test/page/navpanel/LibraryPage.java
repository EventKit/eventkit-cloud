package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Datapack library page.
 */
public class LibraryPage extends ContentPage {
    @FindBy(className = "ol-viewport") private WebElement viewport;

    public LibraryPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return viewport;
    }

}
