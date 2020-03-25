import AlertWarning from '@material-ui/core/SvgIcon/SvgIcon';
import * as React from 'react';
import withWidth from '@material-ui/core/withWidth/withWidth';
import {createStyles, Theme, withStyles} from '@material-ui/core';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import {useState} from 'react';
import numeral from 'numeral';
import {AoiInfobar} from './AoiInfobar';
import AlertCallout from './AlertCallout';
import {getSqKm, getSqKmString} from '../../utils/generic';
import {useJobValidationContext} from './context/JobValidation';

interface Props {
    aoiInfo: any;
    showRevert: boolean;
    onRevertClick: () => void;
    handleBufferClick: () => void;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

function SizeWarning(props: Props) {
    const { classes } = props;
    const [showAlert, setShowAlert] = useState(false);
    const { providerLimits } = useJobValidationContext();

    const originalArea = getSqKmString(props.aoiInfo.originalGeojson);
    const totalArea = getSqKmString(props.aoiInfo.geojson);
    const highestMaxSelectionArea = (providerLimits[0]) ? providerLimits[0].maxArea : -1;
    const aoiArea = getSqKm(props.aoiInfo.geojson);
    const areAllOverArea = highestMaxSelectionArea && highestMaxSelectionArea < aoiArea;
    const areSomeOverArea = highestMaxSelectionArea && providerLimits.some(limits => limits.maxArea < aoiArea);

    const closeAlert = () => setShowAlert(false);
    const bufferAlert = (
        <AlertCallout
            className={`qa-AoiInfobar-alert-buffer ${classes.alertCalloutTop}`}
            onClose={closeAlert}
            orientation="top"
            title="There must be a buffer."
            body={<p>Please add a buffer before moving forward.</p>}
        />
    );

    const getAlert = (message: string, extraProps?: any) => (
        <AlertCallout
            className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
            onClose={closeAlert}
            orientation="top"
            title="Your AOI is too large!"
            {...(extraProps || {})}
            body={(
                <p>
                    {message}
                </p>
            )}
        />
    );

    const overAreaAlert = (
        <AlertCallout
            className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
            onClose={closeAlert}
            orientation="top"
            title="Your AOI is too large!"
            body={(
                <p>
                    The max size allowed for the AOI is {numeral(max).format('0,0')} sq km and yours is {totalArea}.
                    Please reduce the size of your polygon and/or buffer.
                </p>
            )}
        />
    );

    const overSomeAlert = (
        <AlertCallout
            className={`qa-AoiInfobar-alert-overSome ${classes.alertCalloutTop}`}
            onClose={closeAlert}
            orientation="top"
            title="Your AOI is too large for some of the data sources."
            body={(
                <p>
                    The current AOI size of {totalArea}, exceeds the limit set for at least one data source.
                    If you plan to include all available data sources for this area in your DataPack you,
                    need to reduce the size of your polygon and/or buffer
                    to {numeral(props.limits.sizes[0]).format('0,0')} sq km.
                    Specifics for each Data Provider are on the next page.
                </p>
            )}
            style={{ color: colors.black }}
        />
    );

    let bufferWarning = null;
    let sizeWarning = null;
    if (noArea) {
        bufferWarning = (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                <AlertWarning
                    className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                    onClick={showAlert}
                />
                {state.showAlert
                    ? bufferAlert
                    : null
                }
            </div>
        );
    } else if (overAll) {
        sizeWarning = (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                <AlertWarning
                    className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                    onClick={showAlert}
                />
                {state.showAlert
                    ? overAreaAlert
                    : null
                }
            </div>
        );
    } else if (overSome) {
        sizeWarning = (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                <AlertWarning
                    className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                    style={{ fill: colors.over }}
                    onClick={showAlert}
                />
                {state.showAlert
                    ? overSomeAlert
                    : null
                }
            </div>
        );
    }

    return null;
}

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    body: {
        flex: '0 1 auto',
        padding: '15px',
        backgroundColor: theme.eventkit.colors.white,
    },
    sidebar: {
        flex: '0 0 auto',
        flexWrap: 'wrap',
        padding: '15px 5px',
        display: 'block',
        backgroundColor: theme.eventkit.colors.selected_primary,
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
    mobileSidebar: {
        flex: '0 0 auto',
        flexWrap: 'wrap',
        padding: '15px 15px 15px 5px',
        display: 'none',
        [theme.breakpoints.down('sm')]: {
            display: 'block',
        },
    },
    topbar: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px 10px 5px',
    },
    titleBar: {
        flex: '1 0 auto',
        flexWrap: 'wrap',
        width: '100%',
        paddingBottom: '10px',
    },
    title: {
        width: '100%',
    },
    content: {
        display: 'flex',
        flex: '1 0 auto',
    },
    maxSize: {
        fontSize: '12px',
        color: theme.eventkit.colors.grey,
        display: 'flex',
        flexWrap: 'wrap',
    },
    areaColumn: {
        display: 'flex',
        flex: '0 0 auto',
        flexWrap: 'wrap',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    },
    geomColumn: {
        display: 'flex',
        flex: '1 1 auto',
        flexWrap: 'wrap',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingLeft: '15px',
    },
    alert: {
        height: '20px',
        width: '20px',
        fill: theme.eventkit.colors.warning,
        verticalAlign: 'middle',
        cursor: 'pointer',
    },
    alertCalloutTop: {
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '220px',
        color: theme.eventkit.colors.warning,
    },
    button: {
        fontSize: '10px',
        background: 'none',
        border: 'none',
        color: theme.eventkit.colors.primary,
        outline: 'none',
        padding: '0px',
    },
    searchIcon: {
        height: '20px',
        width: '20px',
        fill: theme.eventkit.colors.primary,
        verticalAlign: 'middle',
    },
    bufferButton: {
        height: '30px',
        minHeight: '30px',
        lineHeight: '30px',
        fontWeight: 600,
        textTransform: 'none',
        padding: '0px 10px',
    },
    menuItem: {
        fontSize: '12px',
        lineHeight: '30px',
        minHeight: '30px',
        padding: '0px 16px',
    },
});

export default withWidth()(withStyles(jss, { withTheme: true })(AoiInfobar));
