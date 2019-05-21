package eventkitui.test.page.core;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public abstract class ContentPage extends LoadablePage {

    @FindBy(className = "qa-PageHeader-title") private WebElement header;
    @FindBy(xpath = "//div[contains (@class, 'qa-PageHeader-content')]/button") private WebElement pageTourButton;

    public ContentPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    public WebElement getHeader() {
        return this.header;
    }

    public WebElement getPageTourButton() { return this.pageTourButton; }

}
