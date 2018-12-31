import * as React from 'react';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
}

export class OtherInfoDialog extends React.Component<Props, {}> {
    render() {
        if (!this.props.show) {
            return null;
        }

        return (
            <BaseDialog
                show
                onClose={this.props.onClose}
                title="OTHER GROUPS"
                className="qa-OtherInfoDialog"
            >
                <div
                    style={{ lineHeight: '36px', display: 'flex', justifyContent: 'center' }}
                    className="qa-OtherInfoDialog-body"
                >
                    <div>
                        <span>For groups that you are NOT a member of:</span>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li>You can view the members and administrators of the group</li>
                            <li>You have no rights for data shared with the group</li>
                        </ul>
                        <span>If you wish to request access to a group contact one of the administrators of that group.</span>
                    </div>
                </div>
            </BaseDialog>
        );
    }
}

export default OtherInfoDialog;
