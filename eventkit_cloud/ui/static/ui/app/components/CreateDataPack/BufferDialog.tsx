import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import * as numeral from 'numeral';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/lab/Slider';
import AlertWarning from '@material-ui/icons/Warning';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from './AlertCallout';
import { getSqKm, getSqKmString } from '../../utils/generic';

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
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: theme.eventkit.colors.white,
        width: '70%',
        minWidth: '355px',
        maxWidth: '550px',
        borderRadius: '2px',
        outline: '1px solid rgba(0, 0, 0, 0.1)',
    },
    header: {
        margin: '0px',
        padding: '15px 15px 10px',
        fontSize: '16px',
        lineHeight: '32px',
    },
    body: {
        color: theme.eventkit.colors.text_primary,
        padding: '0px 15px',
        boxSizing: 'border-box',
    },
    footnote: {
        padding: '15px 15px 10px',
        textAlign: 'right',
        color: theme.eventkit.colors.text_primary,
    },
    footer: {
        boxSizing: 'border-box',
        padding: '0px 15px 15px',
        width: '100%',
        textAlign: 'right',
    },
    tableData: {
        width: '50%',
        height: '22px',
    },
    textField: {
        width: '65px',
        height: '24px',
        fontWeight: 'normal',
    },
    clear: {
        float: 'right',
        fill: theme.eventkit.colors.primary,
        cursor: 'pointer',
    },
    warning: {
        height: '20px',
        width: '20px',
        fill: theme.eventkit.colors.warning,
        verticalAlign: 'middle',
        cursor: 'pointer',
    },
    callOut: {
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '220px',
        color: theme.eventkit.colors.warning,
        textAlign: 'left',
    },
    slider: {
        position: 'absolute',
        width: '100%',
        bottom: 0,
        padding: '21px 0px',
    },
});

export interface Props {
    limits: {
        max: number;
        sizes: number[];
    };
    show: boolean;
    value: number;
    valid: boolean;
    handleBufferClick: () => void;
    handleBufferChange: (value: number | string) => void;
    closeBufferDialog: () => void;
    aoi: object;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export interface State {
    showAlert: boolean;
}

export class BufferDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.showAlert = this.showAlert.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
        this.state = {
            showAlert: false,
        };
    }

    private showAlert() {
        this.setState({ showAlert: true });
    }

    private closeAlert() {
        this.setState({ showAlert: false });
    }

    render() {
        const { classes } = this.props;
        const { colors } = this.props.theme.eventkit;

        const bufferActions = [
            <Button
                key="BufferDialog-close"
                className="qa-BufferDialog-Button-close"
                style={{ float: 'left', fontWeight: 'bold' }}
                onClick={this.props.closeBufferDialog}
                variant="text"
                color="primary"
            >
                close
            </Button>,
            <Button
                key="BufferDialog-buffer"
                className="qa-BufferDialog-Button-buffer"
                style={{ fontWeight: 'bold' }}
                variant="contained"
                color="primary"
                onClick={this.props.handleBufferClick}
                disabled={!this.props.valid}
            >
                Update AOI
            </Button>,
        ];

        if (!this.props.show) {
            return null;
        }

        let over = false;
        const maxAoi = this.props.limits.max;
        const totalArea = getSqKmString(this.props.aoi);
        const size = getSqKm(this.props.aoi);
        if (maxAoi && maxAoi < size) {
            over = true;
        }

        let warning = null;
        if (over) {
            warning = (
                <div
                    className="qa-BufferDialog-warning"
                    style={{ position: 'relative', display: 'inline-block', marginRight: '5px' }}
                >
                    <AlertWarning
                        onClick={this.showAlert}
                        className={classes.warning}
                    />
                    {this.state.showAlert ?
                        <AlertCallout
                            onClose={this.closeAlert}
                            orientation="top"
                            title="Your AOI is too large!"
                            body={
                                <p>
                                    The max size allowed for the AOI is {numeral(maxAoi).format('0,0')} sq km and yours is {totalArea}.
                                    Please reduce the size of your buffer and/or polygon
                                </p>
                            }
                            className={classes.callOut}
                        />
                        :
                        null
                    }
                </div>
            );
        }

        return (
            <div>
                <div className={`qa-BufferDialog-background ${classes.background}`} />
                <div className={`qa-BufferDialog-main ${classes.dialog}`}>
                    <div className={`qa-BufferDialog-header ${classes.header}`}>
                        <strong>
                            <div style={{ display: 'inline-block' }}>
                                <span>
                                    BUFFER AOI
                                </span>
                            </div>
                        </strong>
                        <Clear className={classes.clear} onClick={this.props.closeBufferDialog} />
                    </div>
                    <div className={`qa-BufferDialog-body ${classes.body}`}>
                        <div style={{ paddingBottom: '10px', display: 'flex' }}>
                            <TextField
                                className={classes.textField}
                                type="number"
                                name="buffer-value"
                                value={this.props.value}
                                onChange={e => this.props.handleBufferChange(e.target.value)}
                                style={{ color: this.props.valid ? colors.grey : colors.warning }}
                                InputProps={{ style: { fontSize: '14px', lineHeight: '24px' } }}
                                // MUI uses the case of the i to distinguish between Input component and input html element
                                // eslint-disable-next-line react/jsx-no-duplicate-props
                                inputProps={{ style: { textAlign: 'center' } }}
                            />
                            <span style={{ fontSize: '16px', color: colors.grey }}>m</span>
                            <div style={{ flex: '1 1 auto', textAlign: 'right', color: over ? colors.warning : 'initial' }}>
                                {warning}
                                {getSqKmString(this.props.aoi)} total AOI
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <table style={{ width: '100%', position: 'relative' }}>
                                <thead>
                                    <tr>
                                        <td>
                                            <span style={{ float: 'left' }}>0m</span>
                                        </td>
                                        <td>
                                            <span style={{ float: 'right' }}>10,000m</span>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className={classes.tableData} style={{ borderLeft: '1px solid #ccc' }} >
                                            <Slider
                                                className={classes.slider}
                                                step={10}
                                                max={10000}
                                                min={0}
                                                value={this.props.value}
                                                onChange={(e, value) => this.props.handleBufferChange(value)}
                                            />
                                        </td>
                                        <td className={classes.tableData} style={{ borderRight: '1px solid #ccc' }} />
                                    </tr>
                                    <tr>
                                        <td className={classes.tableData} style={{ borderLeft: '1px solid #ccc' }} />
                                        <td className={classes.tableData} style={{ borderRight: '1px solid #ccc' }} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className={`qa-BufferDialog-footnote ${classes.footnote}`}>
                        Once updated, you must <strong>&apos;Revert&apos; to set again.</strong>
                    </div>
                    <div className={`qa-BufferDialog-footer ${classes.footer}`}>
                        {bufferActions}
                    </div>
                </div>
            </div>
        );
    }
}

export default withTheme()(withStyles(jss)(BufferDialog));
