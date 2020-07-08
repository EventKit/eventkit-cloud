import * as React from 'react';

export interface Props {
    member: Eventkit.UserData;
}

export class GroupMemberRow extends React.Component<Props, {}> {
    render() {
        let name = this.props.member.username;
        if (this.props.member.first_name && this.props.member.last_name) {
            name = `${this.props.member.first_name} ${this.props.member.last_name}`;
        }
        const email = this.props.member.email || 'No email provided';
        return (
            <div
                key={this.props.member.username}
                style={{ padding: '6px 0px 0px', fontSize: '14px' }}
                className="qa-GroupMemberRow"
            >
                <div className="qa-GroupMemberRow-name" style={{ wordBreak: 'break-word', fontSize: '14px' }}>
                    <strong>
                        {name}
                        {this.props.member.permission === 'ADMIN' ? ' (Group Admin)' : ''}
                    </strong>
                </div>
                <div className="qa-GroupMemberRow-email" style={{ wordBreak: 'break-word' }}>
                    {email}
                </div>
            </div>
        );
    }
}

export default GroupMemberRow;
