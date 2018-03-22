import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import { IconButton, IconMenu, MenuItem, Paper } from 'material-ui';
import Info from 'material-ui/svg-icons/action/info';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
import Warning from 'material-ui/svg-icons/alert/warning';
import Error from 'material-ui/svg-icons/alert/error';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import moment from 'moment';

export class NotificationGridItem extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let styles = {
            root: {
                display: 'flex',
                padding: '15px',
                fontSize: '18px',
            },
            icon: {
                marginRight: '10px',
                flex: '0 0 auto',
            },
            content: {
                color: '#337AB7',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            contentText: {
                whiteSpace: 'nowrap',
            },
            contentLink: {
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            unread: {
                backgroundColor: '#D5E6F1',
            },
            date: {
                color: 'rgba(0, 0, 0, 0.54)',
                margin: '0 10px',
                fontSize: '12px',
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

        const infoIcon = (
            <Info
                className="qa-NotificationGridItem-StatusIcon"
                style={{...styles.icon, fill: '#4598BF'}}
            />
        );

        const checkCircleIcon = (
            <CheckCircle
                className="qa-NotificationGridItem-StatusIcon"
                style={{...styles.icon, fill: '#55BA63'}}
            />
        );

        const warningIcon = (
            <Warning
                className="qa-NotificationGridItem-StatusIcon"
                style={{...styles.icon, fill: '#F4D225'}}
            />
        );

        const errorIcon = (
            <Error
                className="qa-NotificationGridItem-StatusIcon"
                style={{...styles.icon, fill: '#CE4427'}}
            />
        );

        const data = this.props.notification.data;

        let icon = infoIcon;
        let content;
        switch (this.props.notification.type) {
            case 'datapack-complete-success':
                icon = checkCircleIcon;
                content = [
                    <Link
                        to={`/status/${data.run.job.uid}`}
                        href={`/status/${data.run.job.uid}`}
                        style={styles.contentLink}
                    >
                        {data.run.job.name}
                    </Link>,
                    <span style={styles.contentText}>&nbsp;is complete.</span>
                ];
                break;
            case 'datapack-complete-error':
                icon = errorIcon;
                content = [
                    <Link
                        to={`/status/${data.run.job.uid}`}
                        href={`/status/${data.run.job.uid}`}
                        style={styles.contentLink}
                    >
                        {data.run.job.name}
                    </Link>,
                    <span style={styles.contentText}>&nbsp;failed to complete.</span>
                ];
                break;
            case 'license-update':
                icon = infoIcon;
                content = [
                    <span style={styles.contentText}>You have a&nbsp;</span>,
                    <Link
                        to="/account"
                        href="/account"
                        style={styles.link}
                    >
                        license
                    </Link>,
                    <span style={styles.contentText}>&nbsp;update.</span>
                ];
                break;
            default:
                console.error(`Unsupported type '${this.props.notification.type}' in notification!`, this.props.notification);
        }

        return (
            <Paper style={(this.props.notification.read) ? styles.root : {...styles.root, ...styles.unread}}>
                {icon}
                {content}
                {/*<div style={styles.content}>Blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah</div>*/}
                {/*<div style={styles.content}>*/}
                    {/*{content}*/}
                {/*</div>*/}
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
                        primaryText="Take Action"
                    />
                    {this.props.notification.read ?
                        <MenuItem
                            style={styles.menuItem}
                            primaryText="Mark Unread"
                        />
                        :
                        null
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
