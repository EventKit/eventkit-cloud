package eventkitui.test.page.navpanel.datapack;

import eventkitui.test.page.core.LoadablePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class StatusAndDownload extends LoadablePage {
    public WebElement getDownloadZipButton() {
        return downloadZipButton;
    }

    public WebElement getDeleteExport() {
        return deleteExport;
    }

    public WebElement getRerunExport() {
        return rerunExport;
    }

    public WebElement getCloneExport() {
        return cloneExport;
    }

    // IN PROGRESS,
    @FindBy(xpath = "//a[contains(@class, 'qa-DataPackDetails-Button-zipButton')]") private WebElement downloadZipButton;
    @FindBy(xpath = "//button[contains(@class, 'qa-DataPackOptions-RaisedButton-deleteExport')]") private WebElement deleteExport;
    @FindBy(xpath = "//button[contains(@class, 'qa-DataPackOptions-RaisedButton-rerunExport')]") private WebElement rerunExport;
    @FindBy(xpath = "//button[contains(@class, 'qa-DataPackOptions-RaisedButton-cloneExport')]") private WebElement cloneExport;


    public StatusAndDownload(WebDriver driver, long timeout) {
        super(driver, timeout);
    }

    @Override
    public WebElement loadedElement() {
        return deleteExport;
    }
}
