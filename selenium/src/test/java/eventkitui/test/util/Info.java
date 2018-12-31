package eventkitui.test.util;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * Annotations for individual tests to describe the importance of that test
 */
@Retention(RetentionPolicy.RUNTIME)
public @interface Info {

    public enum Importance {
        LOW, MEDIUM, HIGH, NONE
    }

    Importance importance() default Importance.NONE;
}
