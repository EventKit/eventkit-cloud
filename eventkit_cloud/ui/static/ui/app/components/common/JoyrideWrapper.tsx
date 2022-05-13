import Joyride, {Props} from 'react-joyride';
import {withTheme} from "@material-ui/core";
import {Theme} from "@material-ui/core/styles";
import {JoyRideStyles} from "../../joyride.config";
import {useMatomoContext} from "../MatomoHandler";

interface PropsWithRef extends Props {
    getRef?: any;
    ref?: any;
    theme: Eventkit.Theme & Theme;
    name: string;
}

// Convenience component, specifying the high z-index on styles.options here lets us avoid specifying it every time
// we add a Joyride. The high z-index is needed to keep the tooltips overtop of the UI since Joyride 2.0.0.
// It seemed to work better previously? A more surgical, case-by-case route might be more prudent, but this
// works just fine.
export function EventkitJoyride(props: PropsWithRef) {
    const { styles, getRef, name, callback, ...restOfProps} = props;
    const {pushClick} = useMatomoContext();
    function _callback(data: any) {
        if (data.action === ' start') {
            pushClick({
                eventName: `${name} Page Tour`,
                eventCategory: 'Page Tour',
                eventAction: 'Start Tour'
            });
        }
        callback(data);
    }
    return (
        <Joyride
            ref={getRef}
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
                },
                buttonNext: JoyRideStyles.tooltipStyle.button,
                buttonBack: JoyRideStyles.tooltipStyle.back,
                buttonSkip: JoyRideStyles.tooltipStyle.skip,
                ...styles,
            }}
            callback={_callback}
            {...restOfProps}
        />
    );
}

export default withTheme(EventkitJoyride);