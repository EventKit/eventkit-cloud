import React, { Component, PropTypes } from 'react';
import EnhancedButton from 'material-ui/internal/EnhancedButton';

export class ShareInfoBody extends Component {
    render() {
        const styles = {
            body: {
                minHeight: '100%',
                width: '100%',
                top: 0,
                zIndex: 20,
                position: 'absolute',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
            },
            return: {
                padding: '20px',
                color: '#4598bf',
                fontSize: '12px',
            },
            text: {
                margin: '0px auto',
                fontSize: '12px',
                padding: '10px 20px 20px',
            },
        };

        let title = null;
        let rights = null;
        let adminRights = null;
        if (this.props.view === 'groups') {
            title = (
                <p style={{ fontSize: '14px' }} className="qa-ShareInfoBody-title">
                    <strong>DataPack Share Rights for Groups</strong>
                </p>
            );
            rights = (
                <p className="qa-ShareInfoBody-rights">
                    If a DataPack has been shared with your group, then you may:
                </p>
            );
            adminRights = (
                <p className="qa-ShareInfoBody-adminRights">
                    If a DataPack has been shared with your group and
                    <strong> the admin rights have been specifically shared with administrators,</strong>
                    then you may:
                </p>
            );
        } else {
            title = (
                <p style={{ fontSize: '14px' }} className="qa-ShareInfoBody-title">
                    <strong>DataPack Share Rights for Members</strong>
                </p>
            );
            rights = (
                <p className="qa-ShareInfoBody-rights">
                    If a DataPack has been shared with you, then you may:
                </p>
            );
            adminRights = (
                <p className="qa-ShareInfoBody-adminRights">
                    If a DataPack has been shared with you and you have been appointed to be an administrator, then you may:
                </p>
            );
        }

        return (
            <div
                style={styles.body}
                className="qa-ShareInfoBody-body"
            >
                <EnhancedButton
                    className="qa-ShareInfoBody-EnhancedButton-return"
                    style={styles.return}
                    onClick={this.props.onReturn}
                >
                    {'<'} Return to {this.props.view}
                </EnhancedButton>
                <div style={styles.text} className="qa-ShareInfoBody-text">
                    {title}
                    <p className="qa-ShareInfoBody-rightsTitle">
                        <strong>Member Rights (for Non-Administrators)</strong>
                    </p>
                    {rights}
                    <ul style={{ paddingLeft: '20px' }} className="qa-ShareInfoBody-rightsList">
                        <li>View</li>
                        <li>Clone</li>
                    </ul>
                    <p className="qa-ShareInfoBody-adminRightsTitle">
                        <strong>Administrator Rights</strong>
                    </p>
                    {adminRights}
                    <ul style={{ paddingLeft: '20px' }} className="qa-ShareInfoBody-adminRightsList">
                        <li>View</li>
                        <li>Clone</li>
                        <li>Edit</li>
                        <li>Delete</li>
                        <li>Re-Run</li>
                    </ul>
                </div>
            </div>
        );
    }
}

ShareInfoBody.propTypes = {
    view: PropTypes.oneOf([
        'groups',
        'members',
    ]).isRequired,
    onReturn: PropTypes.func.isRequired,
};

export default ShareInfoBody;
