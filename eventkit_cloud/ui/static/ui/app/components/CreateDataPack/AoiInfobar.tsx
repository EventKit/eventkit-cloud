import * as React from 'react';
import { Theme, withStyles, createStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import * as numeral from 'numeral';
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
import AlertCallout from './AlertCallout';
import IrregularPolygon from '../icons/IrregularPolygon';
import { getSqKm, getSqKmString } from '../../utils/generic';
import { allHaveArea } from '../../utils/mapUtils';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    wrapper: {
        zIndex: 2,
        position: 'absolute',
        width: '100%',
        bottom: '40px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        [theme.breakpoints.only('xs')]: {
            justifyContent: 'start',
        },
    },
    infobar: {
        backgroundColor: theme.eventkit.colors.white,
        display: 'flex',
        margin: '0px 10px',
        pointerEvents: 'auto',
        [theme.breakpoints.only('xs')]: {
            margin: '0px 70px 0px 10px',
        },
    },
    body: {
        flex: '0 1 auto',
        padding: '15px',
    },
    sidebar: {
        flex: '0 0 auto',
        flexWrap: 'wrap',
        padding: '15px',
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
    limits: {
        max: number;
        sizes: number[];
    };
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
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

export interface State {
    showAlert: boolean;
    menuAnchor: null | HTMLElement;
}

export class AoiInfobar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.showAlert = this.showAlert.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleMenuOpen = this.handleMenuOpen.bind(this);
        this.state = {
            showAlert: true,
            menuAnchor: null,
        };
    }

    private getIcon(geomType: string, source: string) {
        const type = geomType.toUpperCase();
        const iconStyle = {
            width: '30px',
            height: '30px',
        };
        if (source === 'Box') {
            return <ImageCropSquare style={iconStyle} className="qa-AoiInfobar-icon-box" color="primary" />;
        } else if (source === 'Map View') {
            return <Extent style={iconStyle} className="qa-AoiInfobar-icon-mapview" color="primary" />;
        } else if (type.includes('POINT')) {
            return <ActionRoom style={iconStyle} className="qa-AoiInfobar-icon-point" color="primary" />;
        } else if (type.includes('LINE')) {
            return <Line style={iconStyle} className="qa-AoiInfobar-icon-line" color="primary" />;
        } else if (type.includes('POLYGON') || type.includes('COLLECTION')) {
            return <IrregularPolygon style={iconStyle} className="qa-AoiInfobar-icon-polygon" color="primary" />;
        }
        return <AlertWarning style={iconStyle} className="qa-AoiInfobar-icon-no-selection" color="primary" />;
    }

    private handleMenuClose() {
        this.setState({ menuAnchor: null });
    }

    private handleMenuOpen(e: React.MouseEvent<HTMLElement>) {
        this.setState({ menuAnchor: e.currentTarget });
    }

    private showAlert() {
        this.setState({ showAlert: true });
    }

    private closeAlert() {
        this.setState({ showAlert: false });
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { classes } = this.props;

        if (Object.keys(this.props.aoiInfo.geojson).length === 0) {
            return null;
        }

        const geometryIcon = this.getIcon(this.props.aoiInfo.geomType, this.props.aoiInfo.description);

        const noArea = !allHaveArea(this.props.aoiInfo.geojson);
        const originalArea = getSqKmString(this.props.aoiInfo.originalGeojson);
        const totalArea = getSqKmString(this.props.aoiInfo.geojson);
        const { max } = this.props.limits;
        const area = getSqKm(this.props.aoiInfo.geojson);
        const overAll = max && max < area;
        const overSome = max && this.props.limits.sizes.some(size => size < area);

        const bufferAlert = (
            <AlertCallout
                className={`qa-AoiInfobar-alert-buffer ${classes.alertCalloutTop}`}
                onClose={this.closeAlert}
                orientation="top"
                title="There must be a buffer."
                body={<p>Please add a buffer before moving forward.</p>}
            />
        );

        const overAreaAlert = (
            <AlertCallout
                className={`qa-AoiInfobar-alert-oversized ${classes.alertCalloutTop}`}
                onClose={this.closeAlert}
                orientation="top"
                title="Your AOI is too large!"
                body={
                    <p>
                        The max size allowed for the AOI is {numeral(max).format('0,0')} sq km and yours is {totalArea}.
                        Please reduce the size of your polygon and/or buffer.
                    </p>
                }
            />
        );

        const overSomeAlert = (
            <AlertCallout
                className={`qa-AoiInfobar-alert-overSome ${classes.alertCalloutTop}`}
                onClose={this.closeAlert}
                orientation="top"
                title="Your AOI is too large for some of the data sources."
                body={
                    <p>
                        The current AOI size of  {totalArea}, exceeds the limit set for at least one data source.
                         If you plan to include all available data sources for this area in your DataPack you,
                          need to reduce the size of your polygon and/or buffer
                           to {numeral(this.props.limits.sizes[0]).format('0,0')} sq km.
                            Specifics for each Data Provider are on the next page.
                    </p>
                }
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
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        bufferAlert
                        :
                        null
                    }
                </div>
            );
        } else if (overAll) {
            sizeWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        overAreaAlert
                        :
                        null
                    }
                </div>
            );
        } else if (overSome) {
            sizeWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className={`qa-AoiInfobar-alert-icon ${classes.alert}`}
                        style={{ fill: colors.over }}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        overSomeAlert
                        :
                        null
                    }
                </div>
            );
        }

        return (
            <div className="qa-AoiInfobar">
                <div className={classes.wrapper}>
                    <div className={`qa-AoiInfobar-body ${classes.infobar}`}>
                        <div className={classes.body}>
                            <div className={classes.titleBar}>
                                <div className={`qa-AoiInfobar-title ${classes.title}`}>
                                    <strong>AREA OF INTEREST (AOI)</strong>
                                </div>
                                <div className={`qa-AoiInfobar-maxSize ${classes.maxSize}`}>
                                    <div style={{ paddingRight: '5px' }}>
                                        {max ? `${numeral(max).format('0,0')} sq km max;` : null}
                                    </div>
                                </div>
                            </div>
                            <div className={`qa-AoiInfobar-content ${classes.content}`}>
                                <div className={`qa-AoiInfobar-areaColumn ${classes.areaColumn}`}>
                                    <div style={{ flex: '1 1 auto' }}><strong>{originalArea}</strong></div>
                                    <div style={{ lineHeight: '30px', marginTop: '5px' }}>
                                        <strong>
                                            {numeral(getSqKm(this.props.aoiInfo.geojson)
                                                - getSqKm(this.props.aoiInfo.originalGeojson)).format('0,0')} sq km
                                        </strong>
                                    </div>
                                    <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
                                    <div>
                                        <strong style={{ color: overAll ? colors.warning : 'initial' }}>
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
                                            <div style={{ flex: '1 1 auto', wordBreak: 'break-word' }} className="qa-AoiInfobar-infoTitle">
                                                <strong>{this.props.aoiInfo.title || ''}</strong>
                                            </div>
                                            <div
                                                style={{ flex: '1 1 auto', wordBreak: 'break-word' }}
                                                className="qa-AoiInfobar-infoDescription"
                                            >
                                                <span className="qa-AoiInfobar-description" style={{ color: colors.grey }}>
                                                    {this.props.aoiInfo.description}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="qa-AoiInfobar-buffer" style={{ marginTop: '5px' }}>
                                        <Button
                                            className={`qa-AoiInfobar-buffer-button ${classes.bufferButton}`}
                                            onClick={this.props.handleBufferClick}
                                            variant="contained"
                                            color="primary"
                                            disabled={!!this.props.aoiInfo.buffer}

                                        >
                                            {`Buffer (${numeral(this.props.aoiInfo.buffer).format('0,0')}m)`}
                                        </Button>
                                        {bufferWarning}
                                    </div>
                                    <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
                                    <div style={{ position: 'relative' }}>
                                        <strong style={{ color: overAll ? colors.warning : 'initial' }}>
                                             TOTAL AOI
                                        </strong>
                                        {sizeWarning}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`qa-AoiInfobar-sidebar ${classes.sidebar}`}>
                            <div style={{ width: '100%', padding: '5px 0px' }}>
                                <button
                                    className={`qa-AoiInfobar-button-zoom ${classes.button}`}
                                    onClick={this.props.clickZoomToSelection}
                                >
                                    <ActionZoomIn
                                        className={`qa-AoiInfobar-ActionZoomIn ${classes.searchIcon}`}
                                    /> ZOOM TO
                                </button>
                            </div>
                            {this.props.showRevert ?
                                <div style={{ width: '100%', padding: '5px 0px' }}>
                                    <button
                                        className={`qa-AoiInfobar-button-revert ${classes.button}`}
                                        onClick={this.props.onRevertClick}
                                    >
                                        <ActionRestore
                                            className={`qa-AoiInfobar-ActionRestore ${classes.searchIcon}`}
                                        /> REVERT
                                    </button>
                                </div>
                                :
                                null
                            }
                        </div>
                        <div className={`qa-AoiInfobar-sidebar-mobile ${classes.mobileSidebar}`}>
                            <IconButton
                                color="primary"
                                onClick={this.handleMenuOpen}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                id="infobar-menu"
                                anchorEl={this.state.menuAnchor}
                                open={Boolean(this.state.menuAnchor)}
                                onClose={this.handleMenuClose}
                            >
                                <MenuItem
                                    onClick={this.props.clickZoomToSelection}
                                    className={classes.menuItem}
                                >
                                    ZOOM TO
                                </MenuItem>
                                <MenuItem
                                    onClick={this.props.onRevertClick}
                                    className={classes.menuItem}
                                    style={{
                                        ...(!this.props.showRevert ? { pointerEvents: 'none', cursor: 'default', color: colors.grey } : {}),
                                    }}
                                >
                                    REVERT
                                </MenuItem>
                            </Menu>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withWidth()(withStyles(jss, { withTheme: true })(AoiInfobar));
