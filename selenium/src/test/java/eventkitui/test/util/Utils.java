package eventkitui.test.util;

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
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
        String gridUrl = "http://localhost:4444/wd/hub";
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
            String fileName = "C:/temp/ektest" + random.nextLong() + ".png";
            FileUtils.copyFile(scrFile, new File(fileName));
            System.out.println(fileName);
        } catch (IOException exception) {
            exception.printStackTrace();
        }
    }
}
