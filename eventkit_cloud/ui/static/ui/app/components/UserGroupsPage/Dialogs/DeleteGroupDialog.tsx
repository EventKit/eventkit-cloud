import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    onDelete: () => void;
    groupName: string;
    theme: Eventkit.Theme & Theme;
}

export class DeleteGroupDialog extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const deleteActions = [
            <Button
                key="delete"
                className="qa-DeleteGroupDialog-delete"
                variant="contained"
                style={{ color: colors.secondary, backgroundColor: colors.warning }}
                onClick={this.props.onDelete}
            >
                DELETE GROUP
            </Button>,
            <Button
                key="cancel"
                className="qa-DeleteGroupDialog-cancel"
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
                title="DELETE GROUP"
                actions={deleteActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                {`Are you sure you'd like to delete '${this.props.groupName}'?`}
            </BaseDialog>
        );
    }
}

export default withTheme()(DeleteGroupDialog);
