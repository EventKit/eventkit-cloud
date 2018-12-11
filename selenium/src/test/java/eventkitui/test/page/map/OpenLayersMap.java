package eventkitui.test.page.map;

import eventkitui.test.page.core.LoadablePage;
import eventkitui.test.util.PointUtils;
import org.openqa.selenium.*;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.awt.geom.Point2D;

/**
 * Open Layers canvas and viewport, may exist on multiple pages for different purposes.
 */
public class OpenLayersMap extends LoadablePage {

    @FindBy(className = "ol-viewport")						private WebElement viewport;
    @FindBy(className = "ol-unselectable")					private WebElement canvas;
    @FindBy(className = "ol-mouse-position")				private WebElement mouseoverCoordinates;
    @FindBy(xpath = "//button [contains (@title, 'Zoom in')]")						private WebElement zoomInButton;
    @FindBy(className = "ol-zoom-out")						private WebElement zoomOutButton;
    @FindBy(className = "qa-DrawBoxButton-button")          private WebElement drawBoxButton;
    @FindBy(xpath = "//div[contains(@class, 'qa-DrawBoxButton-div-selected')]") private WebElement cancelDrawIcon;
    // For zooming automatically
    @FindBy(className = "rbt-input-main") private WebElement searchField;
    @FindBy(className = "qa-SearchAOIButton-button") private WebElement searchButton;
    @FindBy(className = "qa-TypeaheadMenuItem-name") private WebElement searchResult;
    @FindBy(xpath = "//div[contains(@class, 'qa-loading-body')]") private WebElement loadingSpinner;

    public WebElement getCanvas() {
        return canvas;
    }

    public WebElement getMouseoverCoordinates() {
        return mouseoverCoordinates;
    }

    public WebElement getZoomInButton() {
        return zoomInButton;
    }

    public WebElement getZoomOutButton() {
        return zoomOutButton;
    }

    public WebElement getSearchField() {
        return searchField;
    }

    public WebElement getSearchButton() {
        return searchButton;
    }

    public WebElement getSearchResult() {
        return searchResult;
    }

    public Actions getActions() {
        return actions;
    }

    private Actions actions;

    public OpenLayersMap(WebDriver driver, long timeout) {
        super(driver, timeout);
        actions = new Actions(driver);
    }

    @Override
    public WebElement loadedElement() {
        return canvas;
    }

    @Override
    /**
     * Map behavior is a bit different as there doesn't seem to be a component that is the last to be loaded.
     * Instead we will grab a reference to the loading spinner icon and wait for it to no longer be drawn.
     */
    public void waitUntilLoaded() {
        while(true) {
            try {
                loadingSpinner.click();
            }
            catch (StaleElementReferenceException seleniumException) {
                continue;
            }
            catch (NoSuchElementException noSuchElement) {
                break;
            }
        }
    }

    /**
     * Gets the cancel draw icon. This icon will appear when the draw button is clicked and
     * is a good way to ensure that the ui element is responding to clicks.
     * @return
     */
    public WebElement getCancelDrawIcon() {
        return this.cancelDrawIcon;
    }

    /**
     * Open layers map.
     * @return {@link WebElement}
     */
    public WebElement getViewport() {
        return this.viewport;
    }

    /**
     * Returns the draw box button.
     * @return {@link WebElement} Draw box button.
     */
    public WebElement getDrawBoxButton() {
        return drawBoxButton;
    }

    /**
     * Pans the map
     *
     * @param x
     *            The X distance to pan
     * @param y
     *            The Y distance to pan
     */
    public void pan(int x, int y) {
        actions.moveToElement(canvas, 500, 200).click().clickAndHold().moveByOffset(1, 1).moveByOffset(x, y).release().build().perform();
    }

    /**
     * Clicks center of the map and drags to create a bounding box.
     * For use with box mode.
     */
    public void drawBoundingBox() throws InterruptedException {
        actions.moveToElement(viewport);
        actions.click().clickAndHold().moveByOffset(50, 50).release().build().perform();
    }

}
