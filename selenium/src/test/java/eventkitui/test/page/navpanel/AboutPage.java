package eventkitui.test.page.navpanel;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class AboutPage extends LoadablePage {
    @FindBy(className = "qa-InfoParagraph-title") private WebElement paragraphTitle;

    public AboutPage(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return paragraphTitle;
    }

    public WebElement getParagraphTitle() {
        return  paragraphTitle;
    }
}
