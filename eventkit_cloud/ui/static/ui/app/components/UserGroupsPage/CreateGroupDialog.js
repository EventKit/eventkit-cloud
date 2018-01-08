import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import BaseDialog from '../BaseDialog';
import CustomTextField from '../CustomTextField';

export class CreateGroupDialog extends Component {
    render() {
        const createActions = [
            <RaisedButton
                className="qa-UserGroups-CreateDialog-save"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ borderRadius: '0px' }}
                backgroundColor="#4598bf"
                disableTouchRipple
                label="SAVE"
                primary={false}
                onClick={this.props.onSave}
                disabled={!this.props.value}
                // disabledBackgroundColor="#707274"
            />,
            <FlatButton
                className="qa-UserGroups-CreateDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.props.onClose}
            />,
        ];

        return (
            <BaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                title="CREATE GROUP"
                actions={createActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                <CustomTextField
                    hintText="Name Group"
                    maxLength={50}
                    onChange={this.props.onInputChange}
                    value={this.props.value}
                    style={{
                        width: '100%',
                    }}
                    underlineStyle={{
                        borderBottom: '1px solid #4498c0',
                        bottom: '0px',
                    }}
                    underlineFocusStyle={{
                        borderBottom: '2px solid #4498c0',
                        bottom: '0px',
                    }}
                />
            </BaseDialog>
        );
    }
}

CreateGroupDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
};

export default CreateGroupDialog;
