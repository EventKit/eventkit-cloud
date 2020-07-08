import Joyride, {Props} from 'react-joyride';
import * as React from "react";

interface PropsWithRef extends Props { ref: any}

// Convenience component, specifying the high z-index on styles.options here lets us avoid specifying it every time
// we add a Joyride. The high z-index is needed to keep the tooltips overtop of the UI since Joyride 2.0.0.
// It seemed to work better previously? A more surgical, case-by-case route might be more prudent, but this
// works just fine.
export function EventkitJoyride(props: PropsWithRef) {
    return (
        <Joyride
            locale={{
                // @ts-ignore
                back: (<span>Back</span>),
                // @ts-ignore
                close: (<span>Close</span>),
                // @ts-ignore
                last: (<span>Done</span>),
                // @ts-ignore
                next: (<span>Next</span>),
                // @ts-ignore
                skip: (<span>Skip</span>),
            }}
            styles={{
                options: {
                    zIndex: 5000,
                }
            }}
            {...props}
        />
    );
}

export default EventkitJoyride;