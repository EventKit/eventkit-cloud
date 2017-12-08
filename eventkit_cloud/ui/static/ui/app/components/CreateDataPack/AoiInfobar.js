import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in';
import ActionRestore from 'material-ui/svg-icons/action/restore';
import Triangle from 'material-ui/svg-icons/image/details';
import Line from 'material-ui/svg-icons/action/timeline';
import Extent from 'material-ui/svg-icons/action/settings-overscan';
import AlertCallout from './AlertCallout';

export class AoiInfobar extends Component {
    constructor(props) {
        super(props);
        this.showAlert = this.showAlert.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
        this.state = {
            showAlert: true,
        };
    }

    getIcon(geomType, source) {
        const type = geomType.toUpperCase();
        const iconStyle = { width: '35px', height: '100%', verticalAlign: 'top', flexShrink: 0 };
        if (source === 'Box') {
            return <ImageCropSquare style={iconStyle} className="qa-AoiInfobar-icon-box" />;
        } else if (source === 'Map View') {
            return <Extent style={iconStyle} className="qa-AoiInfobar-icon-mapview" />;
        } else if (type.includes('POINT')) {
            return <ActionRoom style={iconStyle} className="qa-AoiInfobar-icon-point" />;
        } else if (type.includes('LINE')) {
            return <Line style={iconStyle} className="qa-AoiInfobar-icon-line" />;
        } else if (type.includes('POLYGON') || type.includes('COLLECTION')) {
            return <Triangle style={iconStyle} className="qa-AoiInfobar-icon-polygon" />;
        }
        return <AlertWarning style={iconStyle} className="qa-AoiInfobar-icon-no-selection" />;
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
            },
            infobar: {
                width: '70%',
                minWidth: '350px',
                maxWidth: '550px',
                margin: '0 auto',
                backgroundColor: '#fff',
            },
            topbar: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 10px 5px',
            },
            title: {
                flexGrow: 2,
                fontSize: '12px',
            },
            alert: {
                height: '20px',
                width: '20px',
                fill: '#d32f2f',
                verticalAlign: 'middle',
            },
            detailbar: {
                display: 'flex',
                padding: '0px 10px 10px 5px',
            },
            button: {
                fontSize: '10px',
                background: 'none',
                border: 'none',
                color: '#4498c0',
                outline: 'none',
                padding: '0px 0px 0px 10px',
            },
            searchIcon: {
                height: '20px',
                width: '20px',
                fill: '#4498c0',
                verticalAlign: 'middle',
            },
            detailText: {
                maxWidth: 'calc(100% - 150px)',
                fontSize: '12px',
            },
            name: {
                paddingLeft: '6px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            description: {
                paddingLeft: '6px',
                width: '100%',
                color: 'grey',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        };

        if (Object.keys(this.props.aoiInfo.geojson).length === 0) {
            return null;
        }

        const geometryIcon = this.getIcon(this.props.aoiInfo.geomType, this.props.aoiInfo.description);

        return (
            <div className="qa-AoiInfobar">
                <div style={styles.wrapper}>
                    <div style={styles.infobar}>
                        <div style={styles.topbar}>
                            <span className="qa-AoiInfobar-title" style={styles.title}>
                                <strong>AREA OF INTEREST (AOI)</strong>
                                { this.props.showAlert ?
                                    (
                                        <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }}>
                                            <AlertWarning
                                                className="qa-AoiInfobar-alert-icon"
                                                style={styles.alert}
                                                onClick={this.showAlert}
                                            />
                                            {this.state.showAlert ?
                                                <AlertCallout style={{ left: '-100px', bottom: '40px' }} onClose={this.closeAlert} />
                                                :
                                                null
                                            }
                                        </div>
                                    )
                                    :
                                    null
                                }
                            </span>
                            {this.props.showRevert ?
                                <button
                                    className="qa-AoiInfobar-button-revert"
                                    style={styles.button}
                                    onClick={this.props.onRevertClick}
                                >
                                    <ActionRestore
                                        style={styles.searchIcon}
                                        className="qa-AoiInfobar-ActionRestore"
                                    /> REVERT TO ORIGINAL
                                </button>
                                :
                                null
                            }
                            <button
                                className="qa-AoiInfobar-button-zoom"
                                style={{ ...styles.button, marginLeft: 'auto' }}
                                onClick={this.props.clickZoomToSelection}
                            >
                                <ActionZoomIn
                                    style={styles.searchIcon}
                                    className="qa-AoiInfobar-ActionZoomIn"
                                /> ZOOM TO SELECTION
                            </button>
                        </div>
                        <div style={styles.detailbar}>
                            {geometryIcon}
                            <div style={styles.detailText}>
                                <div className="qa-AoiInfobar-name" style={styles.name}>
                                    <strong>{this.props.aoiInfo.title || ''}</strong>
                                </div>
                                <div className="qa-AoiInfobar-description" style={styles.description}>
                                    {this.props.aoiInfo.description || 'No AOI Set'}
                                </div>
                            </div>
                            <div style={{ margin: '5px 10px', color: 'grey' }}>+</div>
                            <div className="qa-AoiInfobar-buffer" style={{ marginTop: '5px' }}>
                                {this.props.aoiInfo.buffer ?
                                    <strong>{this.props.aoiInfo.buffer}m Buffer</strong>
                                    :
                                    <RaisedButton
                                        className="qa-AoiInfobar-buffer-button"
                                        onClick={this.props.onBufferClick}
                                        labelStyle={{ color: 'whitesmoke', fontSize: '14px', textTransform: 'none', padding: '0px 10px' }}
                                        overlayStyle={{ height: '25px' }}
                                        buttonStyle={{ backgroundColor: '#4598bf', height: '25px', lineHeight: '25px' }}
                                        style={{ width: '83px' }}
                                        label="0m Buffer"
                                    />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

AoiInfobar.propTypes = {
    aoiInfo: PropTypes.object,
    showAlert: PropTypes.bool,
    showRevert: PropTypes.bool,
    onRevertClick: PropTypes.func,
    clickZoomToSelection: PropTypes.func,
    onBufferClick: PropTypes.func,
};

export default AoiInfobar;
