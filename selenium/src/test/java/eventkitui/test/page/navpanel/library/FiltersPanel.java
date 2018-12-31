package eventkitui.test.page.navpanel.library;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Filters panel on the datapack library page.
 */
public class FiltersPanel extends LoadablePage {
    @FindBy(xpath="//button[contains (@class, 'qa-FilterHeader-Button-apply')]") private WebElement applyFilterButton;
    @FindBy(xpath="//button[contains (@class, 'qa-FilterHeader-Button-clear')]") private WebElement clearFiltersButton;
    /*
    * Panel Selections
     */
    // Permissions
    @FindBy(xpath="//input[contains (@value, 'PRIVATE')]") private WebElement privateBullet;
    @FindBy(xpath="//input[contains (@value, 'PUBLIC')]") private WebElement sharedBullet;

    // Only shows up when sharedBullet is selected
    @FindBy(xpath="//button[contains (@class, 'qa-PermissionsFilter-MembersAndGroups-button')]") private WebElement allMembersAllGroupsButton;
    // Export status
    // TODO - No good way to locate these elements in selenium, everything is dynamic. Need some kind of ID, identifiable class, or value.
    // Date added
    // TODO - Again, most of the Sources checkboxes are impossible to locate in selenium due to solely dynamic content and styling.
    @FindBy(xpath = "//input[contains (@placeholder, 'From')]") private WebElement fromDateField;
    @FindBy(xpath = "//input[contains(@placeholder, 'To')]") private WebElement toDateField;
    @FindBy(className = "DayPicker-wrapper") private WebElement calender; // Will appear when clicking on field.
    @FindBy(className = "DayPicker-Day--today") private WebElement today; // click me to close calender.

    public FiltersPanel(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    public WebElement getApplyFilterButton() {
        return applyFilterButton;
    }

    public WebElement getClearFiltersButton() {
        return clearFiltersButton;
    }

    public WebElement getPrivateBullet() {
        return privateBullet;
    }

    public WebElement getSharedBullet() {
        return sharedBullet;
    }

    public WebElement getFromDateField() {
        return fromDateField;
    }

    public WebElement getToDateField() {
        return toDateField;
    }

    public WebElement getCalender() {
        return calender;
    }

    public WebElement getToday() {
        return today;
    }

    public WebElement getAllMembersAllGroupsButton() {
        return allMembersAllGroupsButton;
    }


    @Override
    public WebElement loadedElement() {
        return getApplyFilterButton();
    }
}
