import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class GroupMemberRow extends Component {
    render() {
        let name = this.props.member.user.username;
        if (this.props.member.user.first_name && this.props.member.user.last_name) {
            name = `${this.props.member.user.first_name} ${this.props.member.user.last_name}`;
        }
        const email = this.props.member.user.email || 'No email provided';
        return (
            <div
                key={this.props.member.user.username}
                style={{ padding: '6px 0px 0px', fontSize: '14px' }}
                className="qa-GroupMemberRow"
            >
                <div className="qa-GroupMemberRow-name" style={{ wordBreak: 'break-word' }}>
                    <strong>
                        {name}
                        {this.props.isGroupAdmin ? ' (Group Admin)' : ''}
                    </strong>
                </div>
                <div className="qa-GroupMemberRow-email" style={{ wordBreak: 'break-word' }}>
                    {email}
                </div>
            </div>
        );
    }
}

GroupMemberRow.defaultProps = {
    isGroupAdmin: false,
};

GroupMemberRow.propTypes = {
    member: PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
        }),
        accepted_licenses: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    isGroupAdmin: PropTypes.bool,
};

export default GroupMemberRow;
