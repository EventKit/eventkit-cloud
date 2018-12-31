package eventkitui.test.page.navpanel.library;

import eventkitui.test.page.core.ContentPage;
import eventkitui.test.page.map.OpenLayersMap;
import eventkitui.test.util.Utils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Datapack library page.
 */
public class LibraryPage extends ContentPage {
    @FindBy(className = "ol-viewport") private WebElement viewport;
    @FindBy(xpath = "//div[contains (@class, 'qa-DataPackSearchBar-TextField')]/div/input") private WebElement searchBar;
    @FindBy(xpath = "//button[contains (@class, 'qa-DataPackFilterButton-FlatButton')]") private WebElement hideShowFiltersButton;
    @FindBy(xpath="//a[contains (@class, 'qa-DataPackLinkButton-Button')]") private WebElement createDataPackButton;
    @FindBy(xpath="//div[contains (@class, 'qa-DataPackPage-Toolbar-sort')]/div/button") private WebElement dataPackSelectionDropdown;
    @FindBy(xpath="//div[contains (@class, 'qa-DataPackPage-Toolbar-sort')]/div[2]/button") private WebElement filteringResultsDropdown;
    @FindBy(className = "qa-DataPackListItem-titleLink") private WebElement listItemDisplay;
    @FindBy(className = "qa-LoadButtons-range") private WebElement dataPackRange;

    // Show more and show less
    @FindBy(xpath = "//button[contains(@class, 'qa-LoadButtons-RaisedButton-showLess')]") private WebElement showLessButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-LoadButtons-RaisedButton-showLess')][2]") private WebElement showMoreButton;

    private FiltersPanel filtersPanel;
    private OpenLayersMap map;

    public WebElement getViewport() {
        return viewport;
    }

    public WebElement getSearchBar() {
        return searchBar;
    }

    public WebElement getHideShowFiltersButton() {
        return hideShowFiltersButton;
    }

    public WebElement getCreateDataPackButton() {
        return createDataPackButton;
    }

    public WebElement getDataPackSelectionDropdown() {
        return dataPackSelectionDropdown;
    }

    public WebElement getFilteringResultsDropdown() {
        return filteringResultsDropdown;
    }

    public WebElement getListItemDisplay() {
        return listItemDisplay;
    }

    public WebElement getDataPackRange() { return dataPackRange; }

    public WebElement getShowMoreButton() { return showMoreButton; }

    public WebElement getShowLessButton() { return showLessButton; }

    public FiltersPanel getFiltersPanel() {
        return filtersPanel;
    }

    public OpenLayersMap getMap() {
        return map;
    }

    public LibraryPage(WebDriver driver, long timeout) {
        super(driver, timeout);
        map = new OpenLayersMap(driver, 20);
        filtersPanel = new FiltersPanel(driver, 10);
        map.waitUntilLoaded();
    }

    @Override
    public WebElement loadedElement() {
        return dataPackRange;
    }

}
