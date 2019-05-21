import * as React from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';
import CustomTextField from '../../CustomTextField';

export interface Props {
    className?: string;
    show: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onSave: () => void;
    value: string;
}

export class CreateGroupDialog extends React.Component<Props, {}> {
    render() {
        const createActions = [
            <Button
                key="save"
                className="qa-CreateGroupDialog-save"
                variant="contained"
                color="primary"
                onClick={this.props.onSave}
                disabled={!this.props.value}
            >
                SAVE
            </Button>,
            <Button
                key="cancel"
                className="qa-CreateGroupDialog-cancel"
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
                title="CREATE GROUP"
                actions={createActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                <CustomTextField
                    placeholder="Name Group"
                    maxLength={50}
                    onChange={this.props.onInputChange}
                    value={this.props.value}
                    autoFocus
                    style={{ width: '100%' }}
                    InputProps={{ style: { lineHeight: '24px', fontSize: '14px', paddingLeft: '5px' } }}
                    className="qa-CreateGroupDialog-textField"
                />
            </BaseDialog>
        );
    }
}

export default CreateGroupDialog;
