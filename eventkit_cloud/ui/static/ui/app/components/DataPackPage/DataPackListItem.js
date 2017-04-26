import React, {PropTypes, Component} from 'react'
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
        this.state = { 
            deviceSize: window.innerWidth < 576 ? 'xs' : 's',
        };
    }

    componentWillUpdate() {
        if(window.innerWidth < 576) {
            if(this.state.deviceSize != 'xs') {
                this.setState({
                    deviceSize: 'xs',
                });
            }            
        }
        else {
            if(this.state.deviceSize != 's') {
                this.setState({
                    deviceSize: 's',
                });
            }
        }
    }

    render() {
        let titleFontSize, subtitleFontSize, subtitleHeight;
        if(this.state.deviceSize == 'xs') {
            titleFontSize = '19px';
            subtitleFontSize ='10px';
            subtitleHeight = '16px';
        }
        else if(this.state.deviceSize == 's') {
            titleFontSize = '23px';
            subtitleFontSize = '14px';
            subtitleHeight = '20px';
        }

        const styles = {
            card: {
                backgroundColor: '#f7f8f8',
                borderRadius: '0px',
                borderTop: 'grey 1px solid',
                paddingBottom: '0px',
            },
            cardTitle:{
                wordWrap: 'break-word',
                padding: '10px 15px',
            },
            completeIcon: {height: subtitleHeight, float: 'right', color: '#bcdfbb', opacity: '0.6'},
            errorIcon: {height: subtitleHeight, float: 'right', color: '#ce4427', opacity: '0.6'},
            runningIcon: {height: subtitleHeight, float: 'right', color: '#f4D225'},
            unpublishedIcon: {height: subtitleHeight, float: 'right', color: 'grey', marginRight: '5px'},
            publishedIcon : {height: subtitleHeight, float: 'right', color: '#bcdfbb', marginRight: '5px'},
            ownerLabel: {float: 'right', color: 'grey'},
        };

        return (
            <Card style={styles.card} key={this.props.run.uid} containerStyle={{padding: '0px'}}>
                <CardTitle 
                    titleColor={'#4598bf'}
                    style={styles.cardTitle} 
                    titleStyle={{fontSize: titleFontSize}}
                    subtitleStyle={{fontSize: subtitleFontSize}}
                    title={
                        <div>
                            <span>
                                <Link to={'/exports/' + this.props.run.uid} style={{color: 'inherit'}}>
                                    {this.props.run.job.name}
                                </Link>
                            </span>
                            <IconMenu
                                style={{float: 'right'}}
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
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="Go to Export Detail"
                                    onClick={() => {window.location.href='/exports/' + this.props.run.uid}}/>
                               
                                {this.props.run.user == this.props.user.data.username ?
                                <MenuItem
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText={'Delete Export'}
                                    onClick={() => {this.props.onRunDelete(this.props.run.uid)}}/>
                                : null}
                            </IconMenu>
                        </div>
                    } 
                    subtitle={
                        <div>
                            <div style={{height: subtitleHeight, lineHeight: subtitleHeight}}>
                                {'Event: ' + this.props.run.job.event}
                            </div>
                            <div style={{height: subtitleHeight, lineHeight: subtitleHeight}}>
                                {'Added: ' + moment(this.props.run.started_at).format('YYYY-MM-DD')}
                                {this.props.run.user == this.props.user.data.username ?
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
    onRunDelete: PropTypes.func.isRequired
};

export default DataPackListItem;
