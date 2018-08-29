import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';
import CustomTextField from '../../CustomTextField';

export class CreateGroupDialog extends Component {
    render() {
        const createActions = [
            <Button
                className="qa-CreateGroupDialog-save"
                variant="contained"
                color="primary"
                onClick={this.props.onSave}
                disabled={!this.props.value}
            >
                SAVE
            </Button>,
            <Button
                className="qa-CreateGroupDialog-cancel"
                variant="flat"
                color="primary"
                onClick={this.props.onClose}
            >
                CANCEL
            </Button>,
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
                    autoFocus
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
                    className="qa-CreateGroupDialog-textField"
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
