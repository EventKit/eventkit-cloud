import PropTypes from 'prop-types';
import React, { Component } from 'react';
import numeral from 'numeral';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Slider from 'material-ui/Slider';
import AlertWarning from '@material-ui/icons/Warning';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from './AlertCallout';
import { getSqKm, getSqKmString } from '../../utils/generic';

export class BufferDialog extends Component {
    constructor(props) {
        super(props);
        this.showAlert = this.showAlert.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
        this.state = {
            showAlert: false,
        };
    }

    showAlert() {
        this.setState({ showAlert: true });
    }

    closeAlert() {
        this.setState({ showAlert: false });
    }

    render() {
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
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#fff',
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
                color: 'rgba(0,0,0,0.6)',
                padding: '0px 15px',
                boxSizing: 'border-box',
            },
            footnote: {
                padding: '15px 15px 10px',
                textAlign: 'right',
                color: 'rgba(0,0,0,0.6)',
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
                color: this.props.valid ? 'grey' : '#d32f2f',
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
            warning: {
                height: '20px',
                width: '20px',
                fill: '#CE4427',
                verticalAlign: 'middle',
                cursor: 'pointer',
            },
            callOut: {
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '220px',
                color: '#ce4427',
                textAlign: 'left',
            },
        };

        const bufferActions = [
            <Button
                key="BufferDialog-close"
                className="qa-BufferDialog-Button-close"
                style={{ float: 'left', fontWeight: 'bold' }}
                onClick={this.props.closeBufferDialog}
                variant="flat"
                color="primary"
            >
                close
            </Button>,
            <Button
                key="BufferDialog-buffer"
                className="qa-BufferDialog-Button-buffer"
                style={{
                    backgroundColor: this.props.valid ? '#initial' : '#e5e5e5',
                    color: this.props.valid ? 'whitesmoke' : '#0000004d',
                    fontWeight: 'bold',
                }}
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

        const sliderColor = this.props.valid ? '#4598bf' : '#d32f2f';
        this.context.muiTheme.slider.selectionColor = sliderColor;

        let over = false;
        const maxAoi = this.props.maxVectorAoiSqKm;
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
                        style={styles.warning}
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
                            style={styles.callOut}
                        />
                        :
                        null
                    }
                </div>
            );
        }

        return (
            <div>
                <div className="qa-BufferDialog-background" style={styles.background} />
                <div className="qa-BufferDialog-main" style={styles.dialog}>
                    <div className="qa-BufferDialog-header" style={styles.header}>
                        <strong>
                            <div style={{ display: 'inline-block' }}>
                                <span>
                                    BUFFER AOI
                                </span>
                            </div>
                        </strong>
                        <Clear style={styles.clear} onClick={this.props.closeBufferDialog} />
                    </div>
                    <div className="qa-BufferDialog-body" style={styles.body}>
                        <div style={{ paddingBottom: '10px', display: 'flex' }}>
                            <TextField
                                type="number"
                                name="buffer-value"
                                value={this.props.value}
                                onChange={e => this.props.handleBufferChange(e.target.value)}
                                style={styles.textField}
                                InputProps={{ style: { fontSize: '14px', lineHeight: '24px' } }}
                                // MUI uses the case of the i to distinguish between Input component and input html element
                                // eslint-disable-next-line react/jsx-no-duplicate-props
                                inputProps={{ style: { textAlign: 'center' } }}
                            />
                            <span style={{ fontSize: '16px', color: 'grey' }}>m</span>
                            <div style={{ flex: '1 1 auto', textAlign: 'right', color: over ? '#ce4427' : 'initial' }}>
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
                                        <td style={{ ...styles.tableData, borderLeft: '1px solid #ccc' }} >
                                            <Slider
                                                style={{ position: 'absolute', width: '100%', bottom: 0 }}
                                                sliderStyle={{ marginTop: '12px', marginBottom: '14px' }}
                                                step={10}
                                                max={10000}
                                                min={0}
                                                value={this.props.value}
                                                onChange={(e, v) => this.props.handleBufferChange(v)}
                                            />
                                        </td>
                                        <td style={{ ...styles.tableData, borderRight: '1px solid #ccc' }} />
                                    </tr>
                                    <tr>
                                        <td style={{ ...styles.tableData, borderLeft: '1px solid #ccc' }} />
                                        <td style={{ ...styles.tableData, borderRight: '1px solid #ccc' }} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="qa-BufferDialog-footnote" style={styles.footnote}>
                        Once updated, you must <strong>&apos;Revert&apos; to set again.</strong>
                    </div>
                    <div className="qa-BufferDialog-footer" style={styles.footer}>
                        {bufferActions}
                    </div>
                </div>
            </div>
        );
    }
}

BufferDialog.defaultProps = {
    maxVectorAoiSqKm: null,
};

BufferDialog.contextTypes = {
    muiTheme: PropTypes.object.isRequired,
};

BufferDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    value: PropTypes.number.isRequired,
    valid: PropTypes.bool.isRequired,
    handleBufferClick: PropTypes.func.isRequired,
    handleBufferChange: PropTypes.func.isRequired,
    closeBufferDialog: PropTypes.func.isRequired,
    aoi: PropTypes.object.isRequired,
    maxVectorAoiSqKm: PropTypes.number,
};

export default BufferDialog;
