import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Button from '@mui/material/Button';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    onLeave: () => void;
    groupName: string;
    theme: Eventkit.Theme & Theme;
}

export class LeaveGroupDialog extends Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const leaveActions = [
            <Button
                key="leave"
                variant="contained"
                className="qa-LeaveGroupDialog-leave"
                style={{ backgroundColor: colors.warning, color: colors.secondary }}
                onClick={this.props.onLeave}
            >
                LEAVE GROUP
            </Button>,
            <Button
                key="cancel"
                className="qa-LeaveGroupDialog-cancel"
                variant="text"
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

export default withTheme(LeaveGroupDialog);
