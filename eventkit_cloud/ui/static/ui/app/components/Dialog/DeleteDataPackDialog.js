import PropTypes from 'prop-types';
import { Component } from 'react';
import ConfirmDialog from './ConfirmDialog';

export class DeleteDataPackDialog extends Component {
    render() {
        return (
            <ConfirmDialog
                className="qa-DeleteDataPackDialog-ConfirmDialog"
                show={this.props.show}
                title="DELETE DATAPACK"
                confirmLabel="Delete"
                onCancel={this.props.onCancel}
                onConfirm={this.props.onDelete}
                isDestructive
            >
                <strong>Are you sure you want to delete this DataPack?</strong>
            </ConfirmDialog>
        );
    }
}

DeleteDataPackDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default DeleteDataPackDialog;
