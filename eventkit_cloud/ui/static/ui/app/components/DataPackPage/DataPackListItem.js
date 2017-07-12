import React, {PropTypes, Component} from 'react'
import {browserHistory} from 'react-router';
import {Link} from 'react-router';
import {Card, CardTitle} from 'material-ui/Card'
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import AlertError from 'material-ui/svg-icons/alert/error';

export class DataPackListItem extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            card: {
                backgroundColor: this.props.backgroundColor || '#f7f8f8',
                borderRadius: '0px',
                borderTop: 'grey 1px solid',
                paddingBottom: '0px',
            },
            cardTitle:{
                wordWrap: 'break-word',
                padding: '10px 15px',
            },
            completeIcon: {height: '18px', float: 'right', color: '#bcdfbb', opacity: '0.6'},
            errorIcon: {height: '18px', float: 'right', color: '#ce4427', opacity: '0.6'},
            runningIcon: {height: '18px', float: 'right', color: '#f4D225'},
            unpublishedIcon: {height: '18px', float: 'right', color: 'grey', marginRight: '5px'},
            publishedIcon : {height: '18px', float: 'right', color: '#bcdfbb', marginRight: '5px'},
            ownerLabel: {float: 'right', color: 'grey'},
            eventText: {height: '18px', lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'},
            titleLink: {height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}
        };

        const onMouseEnter = this.props.onHoverStart ? () => {this.props.onHoverStart(this.props.run.uid)} : null;
        const onMouseLeave = this.props.onHoverEnd ? () => {this.props.onHoverEnd(this.props.run.uid)} : null;
        const onClick = this.props.onClick ? () => {this.props.onClick(this.props.run.uid)} : null;
        return (
            <Card 
                style={styles.card} 
                key={this.props.run.uid} 
                containerStyle={{padding: '0px'}}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
            >
                <CardTitle 
                    titleColor={'#4598bf'}
                    style={styles.cardTitle} 
                    titleStyle={{fontSize: '21px', height: '36px'}}
                    subtitleStyle={{fontSize: '12px'}}
                    title={
                        <div>
                            <div style={{display: 'inline-block', width: 'calc(100% - 24px)', height: '36px'}}>
                                <div style={styles.titleLink}>
                                    <Link 
                                        to={'/status/' + this.props.run.job.uid} 
                                        style={{color: 'inherit'}}>
                                        {this.props.run.job.name}
                                    </Link>
                                </div>
                            </div>
                            <IconMenu
                                style={{float: 'right', width: '24px', height: '100%'}}
                                iconButtonElement={
                                    <IconButton 
                                        style={{padding: '0px', width: '24px', height: '24px', verticalAlign: 'middle'}}
                                        iconStyle={{color: '#4598bf'}}>
                                        <NavigationMoreVert />
                                    </IconButton>}
                                anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
                                targetOrigin={{horizontal: 'right', vertical: 'top'}}
                            >
                                <MenuItem 
                                    style={{fontSize: '12px'}}
                                    primaryText="Go to Export Detail"
                                    onClick={() => {browserHistory.push('/status/'+this.props.run.job.uid)}}/>
                               
                                {this.props.run.user == this.props.user.data.user.username ?
                                <MenuItem
                                    style={{fontSize: '12px'}}
                                    primaryText={'Delete Export'}
                                    onClick={() => {this.props.onRunDelete(this.props.run.uid)}}/>
                                : null}
                            </IconMenu>
                        </div>
                    } 
                    subtitle={
                        <div>
                            <div style={styles.eventText}>
                                {'Event: ' + this.props.run.job.event}
                            </div>
                            <div style={{height: '18px', lineHeight: '18px'}}>
                                {'Added: ' + moment(this.props.run.started_at).format('YYYY-MM-DD')}
                                {this.props.run.user == this.props.user.data.user.username ?
                                    <p style={styles.ownerLabel}>My DataPack</p>
                                    :
                                    <p style={styles.ownerLabel}>{this.props.run.user}</p>
                                }
                                {this.props.run.job.published ? 
                                    <SocialGroup style={styles.publishedIcon}/>
                                    :
                                    
                                    <SocialPerson style={styles.unpublishedIcon}/>
                                }
                                {this.props.run.status == "SUBMITTED" ?
                                    <NotificationSync style={styles.runningIcon}/>
                                    :
                                    this.props.run.status == "INCOMPLETE"  ?
                                        <AlertError style={styles.errorIcon}/>
                                        :
                                        <NavigationCheck style={styles.completeIcon}/>
                                }
                            </div>
                        </div>
                    }
                />
            </Card>
        )
    }
}

DataPackListItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onHoverStart: PropTypes.func,
    onHoverEnd: PropTypes.func,
    onClick: PropTypes.func,
    backgroundColor: PropTypes.string
};

export default DataPackListItem;
