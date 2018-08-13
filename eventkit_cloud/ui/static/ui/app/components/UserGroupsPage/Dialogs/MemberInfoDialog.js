import PropTypes from 'prop-types';
import React, { Component } from 'react';
import BaseDialog from '../../Dialog/BaseDialog';

export class MemberInfoDialog extends Component {
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

MemberInfoDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default MemberInfoDialog;
