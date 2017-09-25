import React, {Component} from 'react';
import UserInfoTableRow from './UserInfoTableRow';
import moment from 'moment';

export class UserInfo extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        return (
            <div className={'qa-UserInfo-header'}>
                <h4><strong>Personal Information</strong></h4>
                {this.props.updateLink ? 
                    <div className={'qa-UserInfo-personalDetails'} style={{color: 'grey'}}>
                        <strong style={{color: '#000'}}>To update</strong> your personal details, please <strong style={{color: '#000'}}>visit</strong>
                        <a href={this.props.updateLink}> here</a>
                    </div>
                    :
                    null
                }
                <table className={'qa-UserInfo-table'} style={{width: '100%', margin: '10px -5px -5px'}}>
                    <tbody>
                        <UserInfoTableRow title={'Username'} data={this.props.user.username}/>
                        <UserInfoTableRow title={'First name'} data={this.props.user.first_name}/>
                        <UserInfoTableRow title={'Last name'} data={this.props.user.last_name}/>
                        <UserInfoTableRow title={'Email'} data={this.props.user.email}/>
                        <UserInfoTableRow title={'Date Joined'} data={moment(this.props.user.date_joined).format('YYYY-MM-DD')}/>
                        <UserInfoTableRow title={'Last Login'} data={moment(this.props.user.last_login).format('YYYY-MM-DD, h:mm a')}/>
                    </tbody>
                </table>
            </div>
        )
    };
};

UserInfo.PropTypes = {
    user: React.PropTypes.object.isRequired,
    updateLink: React.PropTypes.string,
}

export default UserInfo;
