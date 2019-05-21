package eventkitui.test.util;

import eventkitui.test.page.MainPage;
import eventkitui.test.page.navpanel.NavigationPanel;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.SystemUtils;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Random;

public class Utils {
    /**
     * Create the WebDriver to configure for execution on Selenium Grid Chrome driver.
     *
     * @return The Remote Chrome Driver.
     */
    public static WebDriver getChromeRemoteDriver() throws MalformedURLException {
        String gridHost = (System.getenv("SELENIUM_HOST") != null)
                ? System.getenv("SELENIUM_HOST")
                : "localhost";
        String gridPort = (System.getenv("SELENIUM_PORT") != null)
                ? System.getenv("SELENIUM_PORT")
                : "4444";
        String gridUrl = String.format("http://%s:%s/wd/hub", gridHost, gridPort);
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--ignore-certificate-errors");
        options.setCapability("acceptInsecureCerts", true);
        options.setCapability("acceptSslCerts", true);
        options.setCapability("commandTimeout", "600");
        options.setCapability("idleTimeout", "1000");
        RemoteWebDriver driver = new RemoteWebDriver(new URL(gridUrl), options);
        return driver;
    }

    /**
     * Useful snippet to take a screenshot.
     * <p>
     * This should not be used in the actual tests, but more as a helpful method for local debugging.
     *
     * @param driver
     *            The driver instance.
     */
    public static void takeScreenshot(WebDriver driver) {
        File scrFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
        try {
            Random random = new Random();
            String fileName = SystemUtils.IS_OS_WINDOWS ? "C:/temp/ektest" + random.nextLong() + ".png" : "/tmp/ektest" + random.nextLong() + ".png";
            FileUtils.copyFile(scrFile, new File(fileName));
            System.out.println(fileName);
        } catch (IOException exception) {
            exception.printStackTrace();
        }
    }

    /**
     * Ensures nav panel is opened.
     */
    public static NavigationPanel openNavigationPanel(final WebDriver driver, final MainPage mainPage) {
        final NavigationPanel navigationPanel = new NavigationPanel(driver, 10);
        // Nav panel is sometimes open by default, may depend on your previous state.
        try {
            if(!navigationPanel.isLoaded()) {
                mainPage.getTopPanel().openNavigationPanel();
                navigationPanel.waitUntilLoaded();
            }
        }
        catch (final NoSuchElementException noSuchElement) {
            // panel was not open, element did not exist. Open panel and move on.
            mainPage.getTopPanel().openNavigationPanel();
            navigationPanel.waitUntilLoaded();
        }
        return navigationPanel;
    }

    /**
     * Given a tourString, parses out the two numbers that make up how many views exist in the tour.
     * i.e. the "tour page" feature opens a window with a next button with a display like "Next 1/5"
     * This method will return a int[] = {1, 5}
     * @param tourString - Label from the next button on the tour feature window.
     * @return int[] of two numbers representing the indexes of the tour page.
     */
    public static int[] parseTourLabel(final String tourString) {
        if (tourString.equalsIgnoreCase("Done")) {
            return null;
        }
        else {
            final String[] parts = tourString.split("/");
            final String[] parts2 = parts[0].split(" ");

            final int[] twoNumbers = new int[2];

            twoNumbers[0] = Integer.parseInt(parts2[1]);
            twoNumbers[1] = Integer.parseInt(parts[1]);

            return twoNumbers;
        }
    }

    public static boolean checkIfDisplayed(final WebElement webElement) {
        try {
            webElement.isDisplayed();
            return true;
        }
        catch (NoSuchElementException noSuchElement) {
            return false;
        }
    }

}
