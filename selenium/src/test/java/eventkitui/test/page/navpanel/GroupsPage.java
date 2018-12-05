package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.ContentPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Account settings page.
 */
public class GroupsPage extends ContentPage
{
    @FindBy(className = "qa-UserGroupsPage-fixedHeader") private WebElement usersAndGroupsHeader;
    public GroupsPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return usersAndGroupsHeader;
    }

}
