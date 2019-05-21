import * as React from 'react';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
}

export class MemberInfoDialog extends React.Component<Props, {}> {
    render() {
        if (!this.props.show) {
            return null;
        }

        return (
            <BaseDialog
                show
                onClose={this.props.onClose}
                title="MEMBER GROUPS"
                className="qa-MemberInfoDialog"
            >
                <div
                    style={{ lineHeight: '36px', display: 'flex', justifyContent: 'center' }}
                    className="qa-MemberInfoDialog-body"
                >
                    <div>
                        <span>For groups that you are a member of:</span>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li>You will receive all notifications</li>
                            <li>You have limited rights for all data shared with each group</li>
                        </ul>
                        <span>
                            You may leave any group you are a member of. By doing so, you opt out of notifications and your data rights.
                        </span>
                    </div>
                </div>
            </BaseDialog>
        );
    }
}

export default MemberInfoDialog;
