import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import UserInfoTableRow from './UserInfoTableRow';

export class UserInfo extends Component {
    render() {
        const styles = {
            table: {
                width: '100%',
                margin: '10px -5px -5px',
                borderSpacing: '5px',
                borderCollapse: 'separate',
            },
        };

        return (
            <div className="qa-UserInfo-header">
                <h4><strong>Personal Information</strong></h4>
                {this.props.updateLink ?
                    <div className="qa-UserInfo-personalDetails" style={{ color: 'grey' }}>
                        <strong style={{ color: '#000' }}>To update</strong> your personal details, please <strong style={{ color: '#000' }}>visit</strong>
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
                        <UserInfoTableRow title="Date Joined" data={moment(this.props.user.date_joined).format('YYYY-MM-DD')} />
                        <UserInfoTableRow title="Last Login" data={moment(this.props.user.last_login).format('YYYY-MM-DD, h:mm a')} />
                    </tbody>
                </table>
            </div>
        );
    }
}

UserInfo.defaultProps = {
    updateLink: '',
};

UserInfo.propTypes = {
    user: PropTypes.object.isRequired,
    updateLink: PropTypes.string,
};

export default UserInfo;
