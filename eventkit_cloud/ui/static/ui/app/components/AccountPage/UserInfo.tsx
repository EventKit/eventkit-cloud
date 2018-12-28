import * as React from 'react';
import * as moment from 'moment';
import UserInfoTableRow from './UserInfoTableRow';

export interface Props {
    user: Eventkit.User['user'];
    updateLink: string;
}

export class UserInfo extends React.Component<Props, {}> {
    render() {
        const styles = {
            table: {
                width: '100%',
                margin: '10px -5px -5px',
                borderSpacing: '5px',
                borderCollapse: 'separate' as 'separate',
            },
        };

        return (
            <div className="qa-UserInfo-header">
                <h4><strong>Personal Information</strong></h4>
                {this.props.updateLink ?
                    <div className="qa-UserInfo-personalDetails" style={{ color: 'grey' }}>
                        <strong style={{ color: '#000' }}>To update </strong>
                        your personal details, please
                        <strong style={{ color: '#000' }}> visit</strong>
                        <a href={this.props.updateLink}> here</a>
                    </div>
                    :
                    null
                }
                <table className="qa-UserInfo-table" style={styles.table}>
                    <tbody>
                        <UserInfoTableRow title="Username" data={this.props.user.username} />
                        <UserInfoTableRow title="First name" data={this.props.user.first_name} />
                        <UserInfoTableRow title="Last name" data={this.props.user.last_name} />
                        <UserInfoTableRow title="Email" data={this.props.user.email} />
                        <UserInfoTableRow title="Date Joined" data={moment(this.props.user.date_joined).format('M/D/YY')} />
                        <UserInfoTableRow title="Last Login" data={moment(this.props.user.last_login).format('M/D/YY h:mma')} />
                    </tbody>
                </table>
            </div>
        );
    }
}

export default UserInfo;
