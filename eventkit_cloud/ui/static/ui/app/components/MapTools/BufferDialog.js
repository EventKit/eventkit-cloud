import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';
import BaseDialog from '../BaseDialog';

export class BufferDialog extends Component {
    render() {
        const styles = {
            underline: {
                borderBottom: '1px solid grey',
                bottom: '0px',
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0',
                bottom: '0px',
            },
            tableData: {
                border: '1px solid #ccc',
                borderTop: 'none',
                borderBottom: 'none',
                width: '50%',
                height: '22px',
            },
            updateButton: {
                backgroundColor: this.props.valid ? '#4598bf' : '#e5e5e5',
                height: '30px',
                lineHeight: '30px',
            },
            updateLabel: {
                color: this.props.valid ? 'whitesmoke' : '#0000004d',
                fontWeight: 'bold',
            },
            textField: {
                width: '65px',
                height: '24px',
                fontWeight: 'normal',
            },
            dialog: {
                position: 'absolute',
                top: '282px',
                right: '10px',
                margin: 'none',
                maxWidth: '400px',
                transform: 'none',
            },
        };

        const bufferActions = [
            <FlatButton
                className="qa-BufferDialog-FlatButton-close"
                style={{ float: 'left', height: '30px', lineHeight: '30px' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                disableTouchRipple
                label="close"
                onClick={this.props.closeBufferDialog}
            />,
            <RaisedButton
                className="qa-BufferDialog-RaisedButton-buffer"
                labelStyle={styles.updateLabel}
                buttonStyle={styles.updateButton}
                disableTouchRipple
                label="Update Buffer"
                primary
                onClick={this.props.onBufferClick}
                disabled={!this.props.valid}
            />,
        ];

        if (!this.props.show) {
            return null;
        }

        const sliderColor = this.props.valid ? '#4598bf' : '#d32f2f';
        this.context.muiTheme.slider.selectionColor = sliderColor;

        return (
            <BaseDialog
                className="qa-BufferDialog-BaseDialog"
                show
                title={
                    <span>
                        Buffer Feature
                        &nbsp;
                        &nbsp;
                        <TextField
                            type="number"
                            name="buffer-value"
                            value={this.props.value}
                            onChange={this.props.handleBufferChange}
                            style={styles.textField}
                            inputStyle={{ color: this.props.valid ? 'initial' : '#d32f2f' }}
                            underlineStyle={styles.underline}
                            underlineFocusStyle={styles.underlineFocus}
                        />
                        <span style={{ fontSize: '16px' }} >m</span>
                    </span>
                }
                onClose={this.props.closeBufferDialog}
                actions={bufferActions}
                titleStyle={{ padding: '20px' }}
                bodyStyle={{ padding: '0px 20px' }}
                actionsStyle={{ padding: '20px' }}
                overlayStyle={{ backgroundColor: 'none' }}
                dialogStyle={styles.dialog}
            >
                <div style={{ textAlign: 'center' }}>
                    <table style={{ width: 'calc(100% - 20px)', position: 'relative', left: '10px' }}>
                        <thead>
                            <tr>
                                <td>
                                    <span style={{ float: 'left' }}>-10,000 m</span>
                                    <span style={{ float: 'right' }}>0</span>
                                </td>
                                <td>
                                    <span style={{ float: 'left' }}>&nbsp;m</span>
                                    <span style={{ float: 'right' }}>10,000 m</span>
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={styles.tableData} >
                                    <Slider
                                        style={{ position: 'absolute', width: '100%', bottom: 0 }}
                                        sliderStyle={{ marginTop: '12px', marginBottom: '14px' }}
                                        step={10}
                                        max={10000}
                                        min={-10000}
                                        value={this.props.value}
                                        onChange={this.props.handleBufferChange}
                                    />
                                </td>
                                <td style={styles.tableData} />
                            </tr>
                            <tr>
                                <td style={styles.tableData} />
                                <td style={styles.tableData} />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </BaseDialog>
        );
    }
}

BufferDialog.contextTypes = {
    muiTheme: PropTypes.object.isRequired,
};

BufferDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    value: PropTypes.number.isRequired,
    valid: PropTypes.bool.isRequired,
    onBufferClick: PropTypes.func.isRequired,
    handleBufferChange: PropTypes.func.isRequired,
    closeBufferDialog: PropTypes.func.isRequired,
};

export default BufferDialog;
