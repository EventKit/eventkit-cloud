package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Content are that appears when create datapack is selected in navigation bar.
 */
public class CreationPage extends ContentPage {

    public WebElement getNextButton() {
        return nextButton;
    }

    @FindBy(id = "Next") private WebElement nextButton;

    private OpenLayersMap openLayersMap;

    public CreationPage(WebDriver driver, long timeout) {
        super(driver, timeout);
        openLayersMap = new OpenLayersMap(driver, 20);
    }

    @Override
    public WebElement loadedElement() {
        return openLayersMap.getViewport();
    }

    public OpenLayersMap getOpenLayersMap() {
        return openLayersMap;
    }

}
