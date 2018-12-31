import * as React from 'react';
import BaseDialog from '../../Dialog/BaseDialog';

export interface Props {
    className: string;
    show: boolean;
    onClose: () => void;
}

export class AdministratorInfoDialog extends React.Component<Props, {}> {
    render() {
        if (!this.props.show) {
            return null;
        }

        return (
            <BaseDialog
                show
                onClose={this.props.onClose}
                title="ADMINISTRATOR GROUPS"
                className="qa-AdministratorInfoDialog"
            >
                <div
                    style={{ lineHeight: '36px', display: 'flex', justifyContent: 'center' }}
                    className="qa-AdministratorInfoDialog-body"
                >
                    <div>
                        <span>For groups that you are an administrator of:</span>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li>You can add and remove group members</li>
                            <li>You can promote and demote other group administrators</li>
                            <li>You&apos;ll receive all notifications</li>
                            <li>You may have administrative rights for data shared with group administrators</li>
                        </ul>
                        <span>
                            You may leave any administrator group. By doing so, you opt out of notifications, data, and your admin rights.
                            If there are no other administrators you must appoint one before leaving
                        </span>
                    </div>
                </div>
            </BaseDialog>
        );
    }
}

export default AdministratorInfoDialog;
