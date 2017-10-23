import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import BaseDialog from '../BaseDialog';

export class BufferButton extends Component {
    constructor(props) {
        super(props);
        this.onBufferClick = this.onBufferClick.bind(this);
        this.openBufferDialog = this.openBufferDialog.bind(this);
        this.closeBufferDialog = this.closeBufferDialog.bind(this);
        this.handleBufferChange = this.handleBufferChange.bind(this);
        this.state = {
            showDialog: false,
            buffer: 0,
        };
    }

    onBufferClick() {
        this.props.onBufferClick(this.state.buffer);
        this.closeBufferDialog();
    }

    openBufferDialog() {
        this.setState({ showDialog: true });
    }

    closeBufferDialog() {
        this.setState({ showDialog: false, buffer: 0 });
    }

    handleBufferChange(e, newValue) {
        this.setState({ buffer: newValue });
    }

    render() {
        const styles = {
            button: {
                height: '30px',
                width: '50px',
                borderTop: '1px solid #e6e6e6',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: 'none',
                margin: 0,
                padding: 0,
                backgroundColor: '#fff',
                outline: 'none',
                fontSize: '.7em',
                color: '#4498c0',
            },
            underline: {
                borderBottom: '1px solid grey',
                bottom: '0px',
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0',
                bottom: '0px',
            },
        };

        const bufferActions = [
            <RaisedButton
                className="qa-BufferButton-RaisedButton-buffer"
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ backgroundColor: '#55ba63' }}
                disableTouchRipple
                label="Buffer"
                primary
                onClick={this.onBufferClick}
            />,
        ];

        return (
            <button
                style={styles.button}
                onClick={this.openBufferDialog}
                className="qa-BufferButton-button"
            >
                BUFFER
                <BaseDialog
                    className="qa-BufferButton-BaseDialog"
                    show={this.state.showDialog}
                    title="Buffer Feature"
                    onClose={this.closeBufferDialog}
                    actions={bufferActions}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-block' }}>
                            Enter Buffer Distance (meters):
                            <br />
                            <TextField
                                type="number"
                                name="buffer-value"
                                style={{ width: '200px' }}
                                value={this.state.buffer}
                                onChange={this.handleBufferChange}
                                underlineStyle={styles.underline}
                                underlineFocusStyle={styles.underlineFocus}
                            />
                        </div>
                    </div>
                </BaseDialog>
            </button>
        );
    }
}

BufferButton.propTypes = {
    onBufferClick: PropTypes.func.isRequired,
};

export default BufferButton;
