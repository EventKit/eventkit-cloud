import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';

export class DeleteGroupDialog extends Component {
    render() {
        const deleteActions = [
            <Button
                className="qa-DeleteGroupDialog-delete"
                variant="contained"
                style={{ color: 'whitesmoke', backgroundColor: '#ce4427' }}
                onClick={this.props.onDelete}
            >
                DELETE GROUP
            </Button>,
            <Button
                className="qa-DeleteGroupDialog-cancel"
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
                title="DELETE GROUP"
                actions={deleteActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                {`Are you sure you'd like to delete '${this.props.groupName}'?`}
            </BaseDialog>
        );
    }
}

DeleteGroupDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    groupName: PropTypes.string.isRequired,
};

export default DeleteGroupDialog;
