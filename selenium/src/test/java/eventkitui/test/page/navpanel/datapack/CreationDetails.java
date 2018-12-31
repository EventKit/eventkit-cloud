package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Creation datapack details window.
 * Has fields like name, description, dataproviders, and projections.
 */
public class CreationDetails extends LoadablePage {
    @FindBy(id = "Name") private WebElement nameField;
    @FindBy(id = "Description") private WebElement descriptionField;
    @FindBy(id = "Project") private WebElement projectField;
    // TODO There are others that we should test for clickability, these are guaranteed to be there and we will start with them.
    @FindBy(name = "OpenStreetMap Data (Themes)") private WebElement openStreetMapDataThemesCheckBox;
    @FindBy(name = "OpenStreetMap Tiles") private WebElement openStreetMapTilesCheckBox;

    public WebElement getNextButton() {
        return nextButton;
    }

    @FindBy(id = "Next") private WebElement nextButton;


    public CreationDetails(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    public WebElement getNameField() {
        return nameField;
    }

    public WebElement getDescriptionField() {
        return descriptionField;
    }

    public WebElement getProjectField() {
        return projectField;
    }

    public WebElement getOpenStreetMapDataThemesCheckBox() {
        return openStreetMapDataThemesCheckBox;
    }

    public WebElement getOpenStreetMapTilesCheckBox() {
        return openStreetMapTilesCheckBox;
    }

    @Override
    public WebElement loadedElement() {
        return nameField;
    }
}
