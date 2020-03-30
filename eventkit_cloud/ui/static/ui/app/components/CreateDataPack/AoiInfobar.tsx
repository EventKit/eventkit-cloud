import * as React from 'react';
import {Theme, withStyles, createStyles} from '@material-ui/core/styles';
import withWidth, {isWidthUp} from '@material-ui/core/withWidth';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import numeral from 'numeral';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AlertWarning from '@material-ui/icons/Warning';
import ImageCropSquare from '@material-ui/icons/CropSquare';
import ActionRoom from '@material-ui/icons/Room';
import ActionZoomIn from '@material-ui/icons/ZoomIn';
import ActionRestore from '@material-ui/icons/Restore';
import Line from '@material-ui/icons/Timeline';
import Extent from '@material-ui/icons/SettingsOverscan';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import {useState} from 'react';
import AlertCallout from './AlertCallout';
import IrregularPolygon from '../icons/IrregularPolygon';
import {arrayHasValue, getSqKm, getSqKmString} from '../../utils/generic';
import {useJobValidationContext} from './context/JobValidation';

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

export interface Props {
    aoiInfo: {
        geojson: GeoJSON.FeatureCollection;
        originalGeojson: GeoJSON.FeatureCollection;
        geomType: string;
        title: string;
        description: string;
        selectionType: string;
        buffer: number;
    };
    showRevert: boolean;
    onRevertClick: () => void;
    clickZoomToSelection: () => void;
    handleBufferClick: () => void;
    displayTitle?: boolean;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
    ref?: any;
}

AoiInfobar.defaultProps = { displayTitle: true } as Props;

export function getIcon(geomType: string, source: string) {
    const type = geomType.toUpperCase();
    const iconStyle = {
        width: '30px',
        height: '30px',
    };
    if (source === 'Box') {
        return <ImageCropSquare style={iconStyle} className="qa-AoiInfobar-icon-box" color="primary"/>;
    }
    if (source === 'Map View') {
        return <Extent style={iconStyle} className="qa-AoiInfobar-icon-mapview" color="primary"/>;
    }
    if (type.includes('POINT')) {
        return <ActionRoom style={iconStyle} className="qa-AoiInfobar-icon-point" color="primary"/>;
    }
    if (type.includes('LINE')) {
        return <Line style={iconStyle} className="qa-AoiInfobar-icon-line" color="primary"/>;
    }
    if (type.includes('POLYGON') || type.includes('COLLECTION')) {
        return <IrregularPolygon style={iconStyle} className="qa-AoiInfobar-icon-polygon" color="primary"/>;
    }
    return <AlertWarning style={iconStyle} className="qa-AoiInfobar-icon-no-selection" color="primary"/>;
}

export function AoiInfobar(props: Props) {
    const [menuAnchor, setMenuAnchor] = useState(null);

    function handleMenuClose() {
        setMenuAnchor(null);
    }

    function handleMenuOpen(e: React.MouseEvent<HTMLElement>) {
        setMenuAnchor(e.currentTarget);
    }

    const { classes } = props;
    const { colors } = props.theme.eventkit;

    const [showAlert, setShowAlert] = useState(false);
    const closeAlert = () => setShowAlert(false);
    const displayAlert = () => setShowAlert(true);

    const { dataSizeInfo, providerLimits, aoiHasArea, aoiArea } = useJobValidationContext();
    const { haveAvailableEstimates = [], exceedingSize = [], noMaxDataSize = [] } = dataSizeInfo || {};

    let needsWarning = false;
    let aoiAlert = null;

    // No hooks may be declared beyond this point.
    // Hooks must be before any possible return statements.
    if (Object.keys(props.aoiInfo.geojson).length === 0) {
        return null;
    }

    const geometryIcon = getIcon(props.aoiInfo.geomType, props.aoiInfo.description);
    const originalArea = getSqKmString(props.aoiInfo.originalGeojson);
    const totalArea = getSqKmString(props.aoiInfo.geojson);
    const highestMaxSelectionArea = (providerLimits[0]) ? providerLimits[0].maxArea : 0;

    if (aoiHasArea) {
        // If estimates have been fetched successfully and every proivder with estimates has a max data size.
        if (haveAvailableEstimates.length > 0 && haveAvailableEstimates.every(slug => !arrayHasValue(noMaxDataSize, slug))) {
            // If any providers exceed their max data size, and those all providers with estimates exceed their max
            // I.e. if every provider we can check is over their specified max data size.
            if (exceedingSize.length > 0 && haveAvailableEstimates.every(slug => exceedingSize.indexOf(slug) !== -1)) {
                needsWarning = true;
                aoiAlert = (
                    <AlertCallout
                        className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
                        onClose={closeAlert}
                        orientation="top"
                        title="Data sizes exceeded!"
                        body={(
                            <p>
                                All providers exceed their specified maximum allowable data size with the specified
                                AOI
                                and zoom levels. This job cannot be submitted. Please reduce the size of your polygon
                                and/or buffer. Zoom levels may
                                be
                                adjusted on the next step to reduce data size.
                            </p>
                        )}
                        style={{ color: colors.black }}
                    />
                );
            } else if (exceedingSize.length > 0) {
                // Only some providers exceed their max data size
                aoiAlert = (
                    <AlertCallout
                        className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
                        onClose={closeAlert}
                        orientation="top"
                        title="Data sizes exceeded."
                        body={(
                            <p>
                                One or more providers would exceed their maximum allowable data size with the specified
                                AOI
                                and zoom levels. Please reduce the size of your polygon and/or buffer. Zoom levels may
                                be
                                adjusted on the next step to reduce data size.
                            </p>
                        )}
                        style={{ color: colors.black }}
                    />
                );
            }
        } else {
            // Can't check max data sizes, fall back to max AoI.
            const exceedsAreaCount = providerLimits.filter(limits => limits.maxArea <= aoiArea).length;
            if (exceedsAreaCount === providerLimits.length) {
                needsWarning = true;
                aoiAlert = (
                    <AlertCallout
                        className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
                        onClose={closeAlert}
                        orientation="top"
                        title="Your AOI is too large!"
                        body={(
                            <p>
                                The max size allowed for the AOI is {numeral(highestMaxSelectionArea).format('0,0')} sq
                                km
                                and yours is {totalArea}.
                                Please reduce the size of your polygon and/or buffer.
                            </p>
                        )}
                    />
                );
            } else if (exceedsAreaCount > 0) {
                aoiAlert = (
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
                                to {numeral(highestMaxSelectionArea).format('0,0')} sq km.
                                Specifics for each Data Provider are on the next page.
                            </p>
                        )}
                        style={{ color: colors.black }}
                    />
                );
            }
        }
    }

    return (
        <>
            <div className={`qa-AoiInfoBar-container ${classes.body}`}>
                <div className={classes.titleBar}>
                    {props.displayTitle && (
                        <div className={`qa-AoiInfobar-title ${classes.title}`}>
                            <strong>AREA OF INTEREST (AOI)</strong>
                        </div>
                    )}
                    <div className={`qa-AoiInfobar-maxSize ${classes.maxSize}`}>
                        <div style={{ paddingRight: '5px' }}>
                            {highestMaxSelectionArea ? `${numeral(highestMaxSelectionArea).format('0,0')} sq km max;` : null}
                        </div>
                    </div>
                </div>
                <div className={`qa-AoiInfobar-content ${classes.content}`}>
                    <div className={`qa-AoiInfobar-areaColumn ${classes.areaColumn}`}>
                        <div style={{ flex: '1 1 auto' }}><strong>{originalArea}</strong></div>
                        <div style={{ lineHeight: '30px', marginTop: '5px' }}>
                            <strong>
                                {numeral(getSqKm(props.aoiInfo.geojson)
                                    - getSqKm(props.aoiInfo.originalGeojson)).format('0,0')} sq km
                            </strong>
                        </div>
                        <Divider style={{ marginTop: '10px', marginBottom: '10px' }}/>
                        <div>
                            <strong style={{ color: needsWarning ? colors.warning : 'initial' }}>
                                {totalArea}
                            </strong>
                        </div>
                    </div>
                    <div className={`qa-AoiInfobar-geomColumn ${classes.geomColumn}`}>
                        <div className="qa-AoiInfobar-info" style={{ display: 'flex' }}>
                            <div style={{ paddingRight: '5px' }}>
                                {geometryIcon}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                    style={{ flex: '1 1 auto', wordBreak: 'break-word' }}
                                    className="qa-AoiInfobar-infoTitle"
                                >
                                    <strong>{props.aoiInfo.title || ''}</strong>
                                </div>
                                <div
                                    style={{ flex: '1 1 auto', wordBreak: 'break-word' }}
                                    className="qa-AoiInfobar-infoDescription"
                                >
                                    <span className="qa-AoiInfobar-description" style={{ color: colors.grey }}>
                                        {props.aoiInfo.description}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="qa-AoiInfobar-buffer" style={{ marginTop: '5px' }}>
                            <Button
                                className={`qa-AoiInfobar-buffer-button ${classes.bufferButton}`}
                                onClick={props.handleBufferClick}
                                variant="contained"
                                color="primary"
                                disabled={!!props.aoiInfo.buffer}

                            >
                                {`Buffer (${numeral(props.aoiInfo.buffer).format('0,0')}m)`}
                            </Button>
                            {!aoiHasArea && (
                                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                                    <AlertWarning
                                        className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                                        onClick={displayAlert}
                                    />
                                    {showAlert && (
                                        <AlertCallout
                                            className={`qa-AoiInfobar-alert-buffer ${classes.alertCalloutTop}`}
                                            onClose={closeAlert}
                                            orientation="top"
                                            title="There must be a buffer."
                                            body={<p>Please add a buffer before moving forward.</p>}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        <Divider style={{ marginTop: '10px', marginBottom: '10px' }}/>
                        <div style={{ position: 'relative' }}>
                            <strong style={{ color: needsWarning ? colors.warning : 'initial' }}>
                                TOTAL AOI
                            </strong>
                            {aoiAlert && (
                                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                                    <AlertWarning
                                        className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                                        style={{ ...((!needsWarning) ? { fill: colors.over } : {}) }}
                                        onClick={displayAlert}
                                    />
                                    {showAlert && aoiAlert}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`qa-AoiInfobar-sidebar ${classes.sidebar}`}>
                <div style={{ width: '100%', padding: '5px 0px' }}>
                    <button
                        className={`qa-AoiInfobar-button-zoom ${classes.button}`}
                        onClick={props.clickZoomToSelection}
                    >
                        <ActionZoomIn
                            className={`qa-AoiInfobar-ActionZoomIn ${classes.searchIcon}`}
                        /> ZOOM TO
                    </button>
                </div>
                {props.showRevert && (
                    <div style={{ width: '100%', padding: '5px 0px' }}>
                        <button
                            className={`qa-AoiInfobar-button-revert ${classes.button}`}
                            onClick={props.onRevertClick}
                        >
                            <ActionRestore
                                className={`qa-AoiInfobar-ActionRestore ${classes.searchIcon}`}
                            /> REVERT
                        </button>
                    </div>
                )}
            </div>
            <div className={`qa-AoiInfobar-sidebar-mobile ${classes.mobileSidebar}`}>
                <IconButton
                    color="primary"
                    onClick={handleMenuOpen}
                >
                    <MoreVertIcon/>
                </IconButton>
                <Menu
                    id="infobar-menu"
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={handleMenuClose}
                >
                    <MenuItem
                        onClick={props.clickZoomToSelection}
                        className={classes.menuItem}
                    >
                        ZOOM TO
                    </MenuItem>
                    <MenuItem
                        onClick={props.onRevertClick}
                        className={classes.menuItem}
                        style={{
                            ...(!props.showRevert ? {
                                pointerEvents: 'none',
                                cursor: 'default',
                                color: colors.grey,
                            } : {}),
                        }}
                    >
                        REVERT
                    </MenuItem>
                </Menu>
            </div>
        </>
    );
}

export default withWidth()(withStyles(jss, { withTheme: true })(AoiInfobar));
