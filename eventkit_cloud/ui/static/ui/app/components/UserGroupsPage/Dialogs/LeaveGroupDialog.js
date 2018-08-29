import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';

export class LeaveGroupDialog extends Component {
    render() {
        const leaveActions = [
            <Button
                variant="contained"
                className="qa-LeaveGroupDialog-leave"
                style={{ backgroundColor: '#CE4427', color: 'whitesmoke' }}
                onClick={this.props.onLeave}
            >
                LEAVE GROUP
            </Button>,
            <Button
                className="qa-LeaveGroupDialog-cancel"
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
                title="LEAVE GROUP"
                actions={leaveActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                {`I'd like to opt out of all shared rights for the '${this.props.groupName}' group.`}
            </BaseDialog>
        );
    }
}

LeaveGroupDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onLeave: PropTypes.func.isRequired,
    groupName: PropTypes.string.isRequired,
};

export default LeaveGroupDialog;
