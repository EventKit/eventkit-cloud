import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Clear from '@material-ui/icons/Clear';
import AlertWarning from '@material-ui/icons/Warning';
import ImageCropSquare from '@material-ui/icons/CropSquare';
import ActionRoom from '@material-ui/icons/Room';
import Line from '@material-ui/icons/Timeline';
import Extent from '@material-ui/icons/SettingsOverscan';
import IrregularPolygon from '../icons/IrregularPolygon';

export class RevertDialog extends Component {
    getIcon(geomType, source) {
        const type = geomType.toUpperCase();
        const iconStyle = {
            width: '35px',
            height: '35px',
            verticalAlign: 'top',
            flexShrink: 0,
        };
        if (source === 'Box') {
            return <ImageCropSquare style={iconStyle} className="qa-RevertDialog-icon-box" color="primary" />;
        } else if (source === 'Map View') {
            return <Extent style={iconStyle} className="qa-RevertDialog-icon-mapview" color="primary" />;
        } else if (type.includes('POINT')) {
            return <ActionRoom style={iconStyle} className="qa-RevertDialog-icon-point" color="primary" />;
        } else if (type.includes('LINE')) {
            return <Line style={iconStyle} className="qa-RevertDialog-icon-line" color="primary" />;
        } else if (type.includes('POLYGON') || type.includes('COLLECTION')) {
            return <IrregularPolygon style={iconStyle} className="qa-RevertDialog-icon-polygon" color="primary" />;
        }
        return <AlertWarning style={iconStyle} className="qa-RevertDialog-icon-no-selection" color="primary" />;
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            background: {
                position: 'absolute',
                zIndex: 999,
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            },
            dialog: {
                zIndex: 1000,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: colors.white,
                width: '355px',
                borderRadius: '2px',
                outline: '1px solid rgba(0, 0, 0, 0.1)',
            },
            header: {
                margin: '0px',
                padding: '15px',
                fontSize: '16px',
                lineHeight: '32px',
            },
            body: {
                fontSize: '14px',
                padding: '0px 15px',
                boxSizing: 'border-box',
            },
            footer: {
                boxSizing: 'border-box',
                padding: '0px 15px 15px',
                width: '100%',
                textAlign: 'right',
            },
            revert: {
                color: colors.secondary,
                backgroundColor: colors.warning,
                fontWeight: 'bold',
            },
            clear: {
                float: 'right',
                fill: colors.primary,
                cursor: 'pointer',
            },
            detailText: {
                maxWidth: 'calc(100% - 130px)',
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
                color: colors.grey,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        };

        const revertActions = [
            <Button
                key="RevertDialog-close"
                className="qa-RevertDialog-FlatButton-close"
                variant="text"
                style={{ float: 'left', color: colors.primary, fontWeight: 'bold' }}
                onClick={this.props.onRevertClose}
            >
                close
            </Button>,
            <Button
                key="RevertDialog-revert"
                className="qa-RevertDialog-RaisedButton-revert"
                variant="contained"
                style={styles.revert}
                onClick={this.props.onRevertClick}
            >
                Revert
            </Button>,
        ];

        if (!this.props.show) {
            return null;
        }

        const geometryIcon = this.getIcon(this.props.aoiInfo.geomType, this.props.aoiInfo.description);

        return (
            <div>
                <div className="qa-RevertDialog-background" style={styles.background} />
                <div className="qa-RevertDialog-dialog" style={styles.dialog}>
                    <div className="qa-RevertDialog-header" style={styles.header}>
                        <strong>
                            <div style={{ display: 'inline-block' }}>
                                <span>
                                    REVERT TO ORIGINAL
                                </span>
                            </div>
                        </strong>
                        <Clear style={styles.clear} onClick={this.props.onRevertClose} />
                    </div>
                    <div className="qa-RevertDialog-body" style={styles.body}>
                        <div style={{ display: 'flex', padding: '0px 10px 10px 0px' }}>
                            {geometryIcon}
                            <div style={styles.detailText}>
                                <div className="qa-RevertDialog-name" style={styles.name}>
                                    <strong>{this.props.aoiInfo.title || ''}</strong>
                                </div>
                                <div className="qa-RevertDialog-description" style={styles.description}>
                                    {this.props.aoiInfo.description || 'No AOI Set'}
                                </div>
                            </div>
                            <div style={{ margin: '5px 10px', color: colors.grey }}>+</div>
                            <div style={{ marginTop: '5px' }}>
                                <strong>0m Buffer</strong>
                            </div>
                        </div>
                    </div>
                    <div className="qa-RevertDialog-footer" style={styles.footer}>
                        {revertActions}
                    </div>
                </div>
            </div>
        );
    }
}

RevertDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onRevertClick: PropTypes.func.isRequired,
    onRevertClose: PropTypes.func.isRequired,
    aoiInfo: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(RevertDialog);
