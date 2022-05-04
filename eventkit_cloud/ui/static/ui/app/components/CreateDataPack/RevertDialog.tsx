import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import Button from '@mui/material/Button';
import Clear from '@mui/icons-material/Clear';
import AlertWarning from '@mui/icons-material/Warning';
import ImageCropSquare from '@mui/icons-material/CropSquare';
import ActionRoom from '@mui/icons-material/Room';
import Line from '@mui/icons-material/Timeline';
import Extent from '@mui/icons-material/SettingsOverscan';
import IrregularPolygon from '../icons/IrregularPolygon';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
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
        backgroundColor: theme.eventkit.colors.white,
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
        color: theme.eventkit.colors.secondary,
        backgroundColor: theme.eventkit.colors.warning,
        fontWeight: 'bold',
    },
    clear: {
        float: 'right',
        fill: theme.eventkit.colors.primary,
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
        color: theme.eventkit.colors.grey,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
});

export interface Props {
    show: boolean;
    onRevertClick: () => void;
    onRevertClose: () => void;
    aoiInfo: Eventkit.Store.AoiInfo;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export class RevertDialog extends Component<Props, {}> {

    private getIcon(geomType: string, source: string) {
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
        const { classes } = this.props;
        const { colors } = this.props.theme.eventkit;

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
                className={`qa-RevertDialog-RaisedButton-revert ${classes.revert}`}
                variant="contained"
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
                <div className={`qa-RevertDialog-background ${classes.background}`} />
                <div className={`qa-RevertDialog-dialog ${classes.dialog}`}>
                    <div className={`qa-RevertDialog-header ${classes.header}`}>
                        <strong>
                            <div style={{ display: 'inline-block' }}>
                                <span>
                                    REVERT TO ORIGINAL
                                </span>
                            </div>
                        </strong>
                        <Clear className={classes.clear} onClick={this.props.onRevertClose} />
                    </div>
                    <div className={`qa-RevertDialog-body ${classes.body}`}>
                        <div style={{ display: 'flex', padding: '0px 10px 10px 0px' }}>
                            {geometryIcon}
                            <div className={classes.detailText}>
                                <div className={`qa-RevertDialog-name ${classes.name}`}>
                                    <strong>{this.props.aoiInfo.title || ''}</strong>
                                </div>
                                <div className={`qa-RevertDialog-description ${classes.description}`}>
                                    {this.props.aoiInfo.description || 'No AOI Set'}
                                </div>
                            </div>
                            <div style={{ margin: '5px 10px', color: colors.grey }}>+</div>
                            <div style={{ marginTop: '5px' }}>
                                <strong>0m Buffer</strong>
                            </div>
                        </div>
                    </div>
                    <div className={`qa-RevertDialog-footer ${classes.footer}`}>
                        {revertActions}
                    </div>
                </div>
            </div>
        );
    }
}

export default withTheme(withStyles(jss)(RevertDialog));
