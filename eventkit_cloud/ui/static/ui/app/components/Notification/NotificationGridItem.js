import React, { PropTypes, Component } from 'react';
import { IconButton, IconMenu, MenuItem, Paper } from 'material-ui';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import moment from 'moment';
import { getNotificationIcon, getNotificationMessage } from '../../utils/notificationUtils';

export class NotificationGridItem extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let styles = {
            root: {
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                fontSize: (window.innerWidth > 575) ? '18px' : '14px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
            content: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            unread: {
                backgroundColor: '#D5E6F1',
            },
            icon: {
                flex: '0 0 auto',
                marginRight: '10px'
            },
            date: {
                margin: '0 10px',
                fontSize: (window.innerWidth > 575) ? '12px' : '10px',
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
            },
            iconMenu: {
                padding: '0',
                width: '24px',
                height: '24px',
                verticalAlign: 'middle',
            },
            menuItem: {
                fontSize: (window.innerWidth < 768) ? 10 : 12,
            },
        };

        const icon = getNotificationIcon({ notification: this.props.notification });
        const message = getNotificationMessage({ notification: this.props.notification });

        return (
            <Paper style={(this.props.notification.read) ? styles.root : {...styles.root, ...styles.unread}}>
                {icon}
                {message}
                <div style={{flex: '1'}}></div>
                <div style={styles.date}>
                    {moment(this.props.notification.date).fromNow()}
                </div>
                <IconMenu
                    style={{ float: 'right', width: '24px', height: '100%', flex: '0 0 auto' }}
                    iconButtonElement={
                        <IconButton
                            style={styles.iconMenu}
                            iconStyle={{ color: '#4598bf' }}
                        >
                            <NavigationMoreVert />
                        </IconButton>}
                    anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                    targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                >
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="View"
                    />
                    {this.props.notification.read ?
                        <MenuItem
                            style={styles.menuItem}
                            primaryText="Mark Unread"
                        />
                        :
                        <MenuItem
                            style={styles.menuItem}
                            primaryText="Mark Read"
                        />
                    }
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Remove"
                    />
                </IconMenu>
            </Paper>
        );
    }
}

NotificationGridItem.propTypes = {
    notification: PropTypes.object.isRequired,
};

export default NotificationGridItem;
