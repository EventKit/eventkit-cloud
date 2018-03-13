import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import BaseDialog from '../Dialog/BaseDialog';

export class LeaveGroupDialog extends Component {
    render() {
        const leaveActions = [
            <RaisedButton
                className="qa-LeaveGroupDialog-leave"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ backgroundColor: '#CE4427', borderRadius: '0px' }}
                disableTouchRipple
                label="LEAVE GROUP"
                primary={false}
                onClick={this.props.onLeave}
            />,
            <FlatButton
                className="qa-LeaveGroupDialog-cancel"
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
