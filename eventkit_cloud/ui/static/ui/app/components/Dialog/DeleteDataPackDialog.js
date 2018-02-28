import React, {PropTypes, Component} from 'react';
import ConfirmDialog from './ConfirmDialog';

export class DeleteDialog extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ConfirmDialog
                className="qa-DeleteDataPackDialog-ConfirmDialog"
                show={this.props.show}
                title="DELETE DATAPACK"
                confirmLabel="Delete"
                onCancel={this.props.onCancel}
                onConfirm={this.props.onDelete}
                isDestructive={true}
            >
                <strong>Are you sure you want to delete this DataPack?</strong>
            </ConfirmDialog>
        )
    }
}

DeleteDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default DeleteDialog;
