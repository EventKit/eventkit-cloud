import moment from 'moment';
import UserInfoTableRow from './UserInfoTableRow';

export interface Props {
    user: Eventkit.User['user'];
    updateLink: string;
}

export const UserInfo = (props: Props) => {
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
            {props.updateLink ?
                <div className="qa-UserInfo-personalDetails" style={{ color: 'grey' }}>
                    <strong style={{ color: '#000' }}>To update </strong>
                    your personal details, please
                    <strong style={{ color: '#000' }}> visit</strong>
                    <a href={props.updateLink}> here</a>
                </div>
                :
                null
            }
            <table className="qa-UserInfo-table" style={styles.table}>
                <tbody>
                <UserInfoTableRow title="Username" data={props.user.username} />
                <UserInfoTableRow title="First name" data={props.user.first_name} />
                <UserInfoTableRow title="Last name" data={props.user.last_name} />
                <UserInfoTableRow title="Email" data={props.user.email} />
                <UserInfoTableRow title="Date Joined" data={moment(props.user.date_joined).format('M/D/YY')} />
                <UserInfoTableRow title="Last Login" data={moment(props.user.last_login).format('M/D/YY h:mma')} />
                </tbody>
            </table>
        </div>
    );
};

export default UserInfo;
