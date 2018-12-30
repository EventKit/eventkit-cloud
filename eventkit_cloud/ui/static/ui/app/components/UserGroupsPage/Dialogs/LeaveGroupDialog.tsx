import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    onLeave: () => void;
    groupName: string;
    theme: Eventkit.Theme & Theme;
}

export class LeaveGroupDialog extends React.Component<Props, {}> {
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

export default withTheme()(LeaveGroupDialog);
