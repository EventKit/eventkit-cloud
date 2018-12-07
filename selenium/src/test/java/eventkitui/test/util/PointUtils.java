package eventkitui.test.util;

import java.awt.geom.Point2D;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.Assert.assertTrue;

public class PointUtils {

    /**
     * Converts a point to DMS coordinates
     *
     * @param point
     *            The point to convert in lat/lon
     * @return The DMS string
     */
    public static String pointToDMS(Point2D.Double point) {
        String dirX;
        String dirY;
        if (point.x >= 0) {
            dirX = "E";
        } else {
            dirX = "W";
        }
        if (point.y >= 0) {
            dirY = "N";
        } else {
            dirY = "S";
        }
        // Format: DDMMSS(N/S)DDDMMSS(E/W)
        return coordToDMS(Math.abs(point.y)).substring(1) + dirY + coordToDMS(Math.abs(point.x)) + dirX;
    }

    /**
     * Converts a single lat or lon value to DMS
     *
     * @param coord
     *            Lat or Lon value
     * @return DMS string
     */
    public static String coordToDMS(double coord) {
        int deg = (int) coord;
        int min = (int) ((coord - (double) deg) * 60);
        int sec = (int) ((coord - (double) deg - (double) min / 60) * 3600);
        return String.format("%03d%02d%02d", deg, min, sec);
    }

    /**
     * Converts a HDMS Coordinate, as represented in the string format in the OpenLayers coordinate control with HDMS
     * format, to a lat/lon decimal degree.
     * <p>
     * Example form of this HDMS string is "85� 06? 10? N 5� 00? 07? E" or "84� 53? 44? S 4� 59? 41? W"
     *
     * @param dmsString
     *            HDMS Coordinate string
     * @return Decimal degrees point
     */
    public static Point2D.Double HdmsToPoint(String dmsString) {
        // Tokenize the HDMS String
        Pattern pattern = Pattern.compile("([0-9]+).\\s([0-9]+).\\s([0-9]+).\\s([A-Z]+)\\s([0-9]+).\\s([0-9]+).\\s([0-9]+).\\s([A-Z]+)");
        Matcher matcher = pattern.matcher(dmsString);
        Double lonD = null, lonM = null, lonS = null, latD = null, latM = null, latS = null;
        String lonH = null, latH = null;
        if (matcher.find()) {
            // Parse the Tokens for individual values
            latD = Double.parseDouble(matcher.group(1));
            latM = Double.parseDouble(matcher.group(2));
            latS = Double.parseDouble(matcher.group(3));
            latH = matcher.group(4);
            lonD = Double.parseDouble(matcher.group(5));
            lonM = Double.parseDouble(matcher.group(6));
            lonS = Double.parseDouble(matcher.group(7));
            lonH = matcher.group(8);
        }
        // Calculate Northing and Easting as lat/lon
        Double lat = (latD + ((latM * 60 + latS) / 3600)) * (latH.equals("S") ? -1 : 1);
        Double lon = (lonD + ((lonM * 60 + lonS) / 3600)) * (lonH.equals("W") ? -1 : 1);
        // Wrap coordinates
        return new Point2D.Double(lon, lat);
    }

    /**
     * Performs assertions that each lat/lon value of a point is within a specific range of a target point.
     *
     * @param message
     *            The assertion message
     * @param actual
     *            The actual point
     * @param target
     *            The expected target point
     * @param range
     *            The range
     */
    public static void assertPointInRange(String message, Point2D.Double actual, Point2D.Double target, double range) {
        assertTrue("Longitude should be within [-180,180]", Math.abs(actual.x) <= 180);
        assertTrue(String.format(message + ": Longitude should be within %f degrees of the target.  Expected <%f>, Actual <%f>", range,
                target.x, actual.x), Math.abs(actual.x - target.x) < range || 360 - Math.abs(actual.x - target.x) < range);
        assertTrue("Latitude should be within [-90,90]", Math.abs(actual.y) <= 90);
        assertTrue(String.format(message + ": Latitude should be within %f degrees of the target.  Expected <%f>, Actual <%f>", range,
                target.y, actual.y), Math.abs(actual.y - target.y) < range);
    }
}
