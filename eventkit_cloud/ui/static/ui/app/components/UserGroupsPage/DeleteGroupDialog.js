import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import BaseDialog from '../Dialog/BaseDialog';

export class DeleteGroupDialog extends Component {
    render() {
        const deleteActions = [
            <RaisedButton
                className="qa-DeleteGroupDialog-delete"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ backgroundColor: '#CE4427', borderRadius: '0px' }}
                disableTouchRipple
                label="DELETE GROUP"
                primary={false}
                onClick={this.props.onDelete}
            />,
            <FlatButton
                className="qa-DeleteGroupDialog-cancel"
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
