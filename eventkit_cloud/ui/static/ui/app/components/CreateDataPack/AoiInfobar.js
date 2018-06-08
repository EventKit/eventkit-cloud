import React, { Component, PropTypes } from 'react';
import numeral from 'numeral';
import RaisedButton from 'material-ui/RaisedButton';
import Divider from 'material-ui/Divider';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in';
import ActionRestore from 'material-ui/svg-icons/action/restore';
import Line from 'material-ui/svg-icons/action/timeline';
import Extent from 'material-ui/svg-icons/action/settings-overscan';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import AlertCallout from './AlertCallout';
import IrregularPolygon from '../icons/IrregularPolygon';
import { getSqKm, getSqKmString } from '../../utils/generic';
import { allHaveArea } from '../../utils/mapUtils';

export class AoiInfobar extends Component {
    constructor(props) {
        super(props);
        this.update = this.update.bind(this);
        this.showAlert = this.showAlert.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
        this.state = {
            showAlert: true,
        };
    }

    // we need a resize listener because the application level forceUpdate is
    // not working on this component.
    // When we get to React v16 we should just pass width and height to all components
    // via the application context.
    componentDidMount() {
        window.addEventListener('resize', this.update);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.update);
    }

    getIcon(geomType, source) {
        const type = geomType.toUpperCase();
        const iconStyle = {
            width: '30px',
            height: '30px',
        };
        if (source === 'Box') {
            return <ImageCropSquare style={iconStyle} className="qa-AoiInfobar-icon-box" />;
        } else if (source === 'Map View') {
            return <Extent style={iconStyle} className="qa-AoiInfobar-icon-mapview" />;
        } else if (type.includes('POINT')) {
            return <ActionRoom style={iconStyle} className="qa-AoiInfobar-icon-point" />;
        } else if (type.includes('LINE')) {
            return <Line style={iconStyle} className="qa-AoiInfobar-icon-line" />;
        } else if (type.includes('POLYGON') || type.includes('COLLECTION')) {
            return <IrregularPolygon style={iconStyle} className="qa-AoiInfobar-icon-polygon" />;
        }
        return <AlertWarning style={iconStyle} className="qa-AoiInfobar-icon-no-selection" />;
    }

    update() {
        this.forceUpdate();
    }

    showAlert() {
        this.setState({ showAlert: true });
    }

    closeAlert() {
        this.setState({ showAlert: false });
    }

    render() {
        const styles = {
            wrapper: {
                zIndex: 2,
                position: 'absolute',
                width: '100%',
                bottom: '40px',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
            },
            infobar: {
                backgroundColor: '#fff',
                display: 'flex',
                margin: '0px 10px',
                pointerEvents: 'auto',
            },
            body: {
                flex: '0 1 auto',
                padding: '15px',
            },
            sidebar: {
                flex: '0 0 auto',
                flexWrap: 'wrap',
                padding: '15px',
                backgroundColor: 'rgba(68, 152, 192, 0.2)',
            },
            mobileSidebar: {
                flex: '0 0 auto',
                flexWrap: 'wrap',
                padding: '15px 15px 15px 5px',
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
                fontSize: '14px',
                width: '100%',
            },
            content: {
                display: 'flex',
                flex: '1 0 auto',
            },
            maxSize: {
                fontSize: '12px',
                color: 'grey',
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
                fill: '#CE4427',
                verticalAlign: 'middle',
                cursor: 'pointer',
            },
            alertCalloutTop: {
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '220px',
                color: '#ce4427',
            },
            button: {
                fontSize: '10px',
                background: 'none',
                border: 'none',
                color: '#4498c0',
                outline: 'none',
                padding: '0px',
            },
            searchIcon: {
                height: '20px',
                width: '20px',
                fill: '#4498c0',
                verticalAlign: 'middle',
            },
            bufferLabel: {
                fontWeight: 600,
                fontSize: '14px',
                textTransform: 'none',
                padding: '0px 10px',
            },
        };

        if (Object.keys(this.props.aoiInfo.geojson).length === 0) {
            return null;
        }

        const geometryIcon = this.getIcon(this.props.aoiInfo.geomType, this.props.aoiInfo.description);

        const fullSidebar = (
            <div style={styles.sidebar} className="qa-AoiInfobar-sidebar">
                <div style={{ width: '100%', padding: '5px 0px' }}>
                    <button
                        className="qa-AoiInfobar-button-zoom"
                        style={styles.button}
                        onClick={this.props.clickZoomToSelection}
                    >
                        <ActionZoomIn
                            style={styles.searchIcon}
                            className="qa-AoiInfobar-ActionZoomIn"
                        /> ZOOM TO
                    </button>
                </div>
                {this.props.showRevert ?
                    <div style={{ width: '100%', padding: '5px 0px' }}>
                        <button
                            className="qa-AoiInfobar-button-revert"
                            style={styles.button}
                            onClick={this.props.onRevertClick}
                        >
                            <ActionRestore
                                style={styles.searchIcon}
                                className="qa-AoiInfobar-ActionRestore"
                            /> REVERT
                        </button>
                    </div>
                    :
                    null
                }
            </div>
        );

        const mobileSidebar = (
            <div style={styles.mobileSidebar} className="qa-AoiInfobar-sidebar-mobile">
                <IconMenu
                    iconButtonElement={
                        <IconButton style={{ padding: '0px', width: '24px' }}>
                            <MoreVertIcon />
                        </IconButton>
                    }
                    anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                    targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                >
                    <MenuItem
                        primaryText="ZOOM TO"
                        onClick={this.props.clickZoomToSelection}
                        style={{ fontSize: '12px', lineHeight: '30px', minHeight: '30px' }}
                    />
                    <MenuItem
                        primaryText="REVERT"
                        onClick={this.props.onRevertClick}
                        disabled={!this.props.showRevert}
                        style={{ fontSize: '12px', lineHeight: '30px', minHeight: '30px' }}
                    />
                </IconMenu>
            </div>
        );

        const sidebar = window.innerWidth < 768 ? mobileSidebar : fullSidebar;

        const noArea = !allHaveArea(this.props.aoiInfo.geojson);
        const originalArea = getSqKmString(this.props.aoiInfo.originalGeojson);
        const totalArea = getSqKmString(this.props.aoiInfo.geojson);
        const { maxVectorAoiSqKm, maxRasterAoiSqKm } = this.props;
        const max = Math.max(maxVectorAoiSqKm, maxRasterAoiSqKm);
        const area = getSqKm(this.props.aoiInfo.geojson);
        const over = max && max < area;
        const vectorOver = area > maxVectorAoiSqKm;
        const rasterOver = area > maxRasterAoiSqKm;

        const bufferAlert = (
            <AlertCallout
                className="qa-AoiInfobar-alert-buffer"
                onClose={this.closeAlert}
                orientation="top"
                title="There must be a buffer."
                body={<p>Please add a buffer before moving forward.</p>}
                style={styles.alertCalloutTop}
            />
        );

        const overAreaAlert = (
            <AlertCallout
                className="qa-AoiInfobar-alert-oversized"
                onClose={this.closeAlert}
                orientation="top"
                title="Your AOI is too large!"
                body={
                    <p>
                        The max size allowed for the AOI is {numeral(maxVectorAoiSqKm).format('0,0')} sq km and yours is {totalArea}.
                        Please reduce the size of your polygon and/or buffer.
                    </p>
                }
                style={styles.alertCalloutTop}
            />
        );

        const rasterAlert = (
            <AlertCallout
                className="qa-AoiInfobar-alert-raster"
                onClose={this.closeAlert}
                orientation="top"
                title="Your AOI is too large for raster data."
                body={
                    <p>
                        The maximum AOI size for raster sources is {numeral(maxRasterAoiSqKm).format('0,0')} sq km
                         and your current AOI is {totalArea}.
                         If you plan to include raster data in your DataPack you need to reduce the size of your polygon and/or buffer.
                    </p>
                }
                style={{ ...styles.alertCalloutTop, color: '#000' }}
            />
        );

        const vectorAlert = (
            <AlertCallout
                className="qa-AoiInfobar-alert-vector"
                onClose={this.closeAlert}
                orientation="top"
                title="Your AOI is too large for vector data."
                body={
                    <p>
                        The maximum AOI size for vector sources is {numeral(maxVectorAoiSqKm).format('0,0')} sq km
                         and your current AOI is {totalArea}.
                         If you plan to include vector data in your DataPack you need to reduce the size of your polygon and/or buffer.
                    </p>
                }
                style={{ ...styles.alertCalloutTop, color: '#000' }}
            />
        );

        let bufferWarning = null;
        let sizeWarning = null;
        if (noArea) {
            bufferWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className="qa-AoiInfobar-alert-icon"
                        style={styles.alert}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        bufferAlert
                        :
                        null
                    }
                </div>
            );
        } else if (over) {
            sizeWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className="qa-AoiInfobar-alert-icon"
                        style={styles.alert}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        overAreaAlert
                        :
                        null
                    }
                </div>
            );
        } else if (vectorOver) {
            sizeWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className="qa-AoiInfobar-alert-icon"
                        style={{ ...styles.alert, fill: '#FAA619' }}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        vectorAlert
                        :
                        null
                    }
                </div>
            );
        } else if (rasterOver) {
            sizeWarning = (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                    <AlertWarning
                        className="qa-AoiInfobar-alert-icon"
                        style={{ ...styles.alert, fill: '#FAA619' }}
                        onClick={this.showAlert}
                    />
                    {this.state.showAlert ?
                        rasterAlert
                        :
                        null
                    }
                </div>
            );
        }

        return (
            <div className="qa-AoiInfobar">
                <div style={styles.wrapper}>
                    <div style={styles.infobar}>
                        <div style={styles.body}>
                            <div style={styles.titleBar}>
                                <div className="qa-AoiInfobar-title" style={styles.title}>
                                    <strong>AREA OF INTEREST (AOI)</strong>
                                </div>
                                <div className="qa-AoiInfobar-maxSize" style={styles.maxSize}>
                                    <div style={{ paddingRight: '5px' }}>
                                        {maxVectorAoiSqKm ? `Vector: ${numeral(maxVectorAoiSqKm).format('0,0')} sq km max;` : null}
                                    </div>
                                    <div style={{ paddingRight: '5px' }}>
                                        {maxRasterAoiSqKm ? `Raster: ${numeral(maxRasterAoiSqKm).format('0,0')} sq km max;` : null}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.content} className="qa-AoiInfobar-content">
                                <div style={styles.areaColumn} className="qa-AoiInfobar-areaColumn">
                                    <div style={{ flex: '1 1 auto' }}><strong>{originalArea}</strong></div>
                                    <div style={{ lineHeight: '30px', marginTop: '5px' }}>
                                        <strong>
                                            {numeral(getSqKm(this.props.aoiInfo.geojson)
                                                - getSqKm(this.props.aoiInfo.originalGeojson)).format('0,0')} sq km
                                        </strong>
                                    </div>
                                    <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
                                    <div>
                                        <strong style={{ color: over ? '#CE4427' : 'initial' }}>
                                            {totalArea}
                                        </strong>
                                    </div>
                                </div>
                                <div style={styles.geomColumn} className="qa-AoiInfobar-geomColumn">
                                    <div className="qa-AoiInfobar-info" style={{ display: 'flex' }}>
                                        <div style={{ paddingRight: '5px' }}>
                                            {geometryIcon}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ flex: '1 1 auto', wordBreak: 'break-word' }} className="qa-AoiInfobar-infoTitle">
                                                <strong>{this.props.aoiInfo.title || ''}</strong>
                                            </div>
                                            <div style={{ flex: '1 1 auto', wordBreak: 'break-word' }} className="qa-AoiInfobar-infoDescription">
                                                <span className="qa-AoiInfobar-description" style={{ color: 'grey' }}>
                                                    {this.props.aoiInfo.description}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="qa-AoiInfobar-buffer" style={{ marginTop: '5px' }}>
                                        <RaisedButton
                                            className="qa-AoiInfobar-buffer-button"
                                            onClick={this.props.handleBufferClick}
                                            labelStyle={styles.bufferLabel}
                                            overlayStyle={{ height: '30px' }}
                                            buttonStyle={{ height: '30px', lineHeight: '30px' }}
                                            label={`Buffer (${numeral(this.props.aoiInfo.buffer).format('0,0')}m)`}
                                            backgroundColor="#4598bf"
                                            labelColor="#f5f5f5"
                                            disabled={!!this.props.aoiInfo.buffer}
                                            disabledBackgroundColor="#e6e6e6"
                                            disabledLabelColor="#333"
                                        />
                                        {bufferWarning}
                                    </div>
                                    <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
                                    <div style={{ position: 'relative' }}>
                                        <strong style={{ color: over ? '#CE4427' : 'initial' }}>
                                             TOTAL AOI
                                        </strong>
                                        {sizeWarning}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {sidebar}
                    </div>
                </div>
            </div>
        );
    }
}

AoiInfobar.defaultProps = {
    maxVectorAoiSqKm: null,
    maxRasterAoiSqKm: null,
};

AoiInfobar.propTypes = {
    aoiInfo: PropTypes.shape({
        geojson: PropTypes.object,
        originalGeojson: PropTypes.object,
        geomType: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        selectionType: PropTypes.string,
        buffer: PropTypes.number,
    }).isRequired,
    showRevert: PropTypes.bool.isRequired,
    maxVectorAoiSqKm: PropTypes.number,
    maxRasterAoiSqKm: PropTypes.number,
    onRevertClick: PropTypes.func.isRequired,
    clickZoomToSelection: PropTypes.func.isRequired,
    handleBufferClick: PropTypes.func.isRequired,
};

export default AoiInfobar;
