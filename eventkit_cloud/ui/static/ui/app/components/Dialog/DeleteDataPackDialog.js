import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ConfirmDialog from './ConfirmDialog';

export class DeleteDataPackDialog extends Component {
    render() {
        return (
            <ConfirmDialog
                className="qa-DeleteDataPackDialog-ConfirmDialog"
                confirmLabel="Delete"
                isDestructive
                onCancel={this.props.onCancel}
                onConfirm={this.props.onDelete}
                show={this.props.show}
                title="DELETE DATAPACK"
            >
                <strong>Are you sure you want to delete this DataPack?</strong>
            </ConfirmDialog>
        );
    }
}

DeleteDataPackDialog.propTypes = {
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
};

export default DeleteDataPackDialog;
