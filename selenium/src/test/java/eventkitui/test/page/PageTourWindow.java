package eventkitui.test.page;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class PageTourWindow extends LoadablePage {
    @FindBy(xpath = "//button[contains (@class, 'joyride-tooltip__close')]") private WebElement closeButton;
    // Next or Done button
    @FindBy(xpath = "//button[contains (@class, 'joyride-tooltip__button--primary')]") private WebElement primaryButton;

    // Back button
    @FindBy(xpath = "//button[contains (@class, 'joyride-tooltip__button--secondary')]") private WebElement secondaryButton;


    public PageTourWindow(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return closeButton;
    }

    public WebElement getCloseButton() {
        return closeButton;
    }

    public WebElement getPrimaryButton() {
        return primaryButton;
    }

    public WebElement getSecondaryButton() {
        return secondaryButton;
    }

}
