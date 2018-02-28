import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import BaseDialog from '../Dialog/BaseDialog';
import CustomTextField from '../CustomTextField';

export class RenameGroupDialog extends Component {
    render() {
        const createActions = [
            <RaisedButton
                className="qa-RenameGroupDialog-save"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ borderRadius: '0px' }}
                backgroundColor="#4598bf"
                disableTouchRipple
                label="RENAME"
                primary={false}
                onClick={this.props.onSave}
                disabled={!this.props.value || !this.props.valid}
            />,
            <FlatButton
                className="qa-RenameGroupDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.props.onClose}
            />,
        ];

        const underlineColor = this.props.valid ? '#4498c0' : '#ce4427';

        return (
            <BaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                title="RENAME GROUP"
                actions={createActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                {!this.props.valid ?
                    <div style={{ color: '#ce4427' }}>Name unavailable</div>
                    :
                    null
                }
                <CustomTextField
                    hintText="Rename Group"
                    maxLength={50}
                    onChange={this.props.onInputChange}
                    value={this.props.value}
                    style={{
                        width: '100%',
                    }}
                    underlineStyle={{
                        borderBottom: `1px solid ${underlineColor}`,
                        bottom: '0px',
                    }}
                    underlineFocusStyle={{
                        borderBottom: `2px solid ${underlineColor}`,
                        bottom: '0px',
                    }}
                    className="qa-RenameGroupDialog-textField"
                />
            </BaseDialog>
        );
    }
}

RenameGroupDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    valid: PropTypes.bool.isRequired,
};

export default RenameGroupDialog;
