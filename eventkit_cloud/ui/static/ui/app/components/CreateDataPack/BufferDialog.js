import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';
import Clear from 'material-ui/svg-icons/content/clear';

export class BufferDialog extends Component {
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
                padding: '15px',
                fontSize: '16px',
                lineHeight: '32px',
            },
            body: {
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                padding: '0px 15px',
                boxSizing: 'border-box',
            },
            footnote: {
                padding: '15px 15px 10px',
                textAlign: 'right',
                color: 'rgba(0,0,0,0.6)',
                fontSize: '14px',
            },
            footer: {
                boxSizing: 'border-box',
                padding: '0px 15px 15px',
                width: '100%',
                textAlign: 'right',
            },
            underline: {
                borderBottom: '1px solid grey',
                bottom: '0px',
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0',
                bottom: '0px',
            },
            tableData: {
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
                fontSize: '14px',
                width: '65px',
                height: '24px',
                fontWeight: 'normal',
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
        };

        const bufferActions = [
            <FlatButton
                key="BufferDialog-close"
                className="qa-BufferDialog-FlatButton-close"
                style={{ float: 'left', height: '30px', lineHeight: '30px' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                disableTouchRipple
                label="close"
                onClick={this.props.closeBufferDialog}
            />,
            <RaisedButton
                key="BufferDialog-buffer"
                className="qa-BufferDialog-RaisedButton-buffer"
                labelStyle={styles.updateLabel}
                buttonStyle={styles.updateButton}
                disableTouchRipple
                label="Update AOI"
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
            <div>
                <div style={styles.background} />
                <div style={styles.dialog}>
                    <div className="qa-BaseDialog-div" style={styles.header}>
                        <strong>
                            <div style={{ display: 'inline-block' }}>
                                <span>
                                    BUFFER AOI
                                    &nbsp;
                                    &nbsp;
                                    <TextField
                                        type="number"
                                        name="buffer-value"
                                        value={this.props.value}
                                        onChange={this.props.handleBufferChange}
                                        style={styles.textField}
                                        inputStyle={{ color: this.props.valid ? 'grey' : '#d32f2f' }}
                                        underlineStyle={styles.underline}
                                        underlineFocusStyle={styles.underlineFocus}
                                    />
                                    <span style={{ fontSize: '16px', color: 'grey' }}>m</span>
                                </span>
                            </div>
                        </strong>
                        <Clear style={styles.clear} onClick={this.props.closeBufferDialog} />
                    </div>
                    <div style={styles.body}>
                        <div style={{ textAlign: 'center' }}>
                            <table style={{ width: 'calc(100% - 20px)', position: 'relative', left: '10px' }}>
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
                                                onChange={this.props.handleBufferChange}
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
                    <div style={styles.footnote}>
                        Once updated, you must <strong>'Revert' to set again.</strong>
                    </div>
                    <div style={styles.footer}>
                        {bufferActions}
                    </div>
                </div>
            </div>
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
