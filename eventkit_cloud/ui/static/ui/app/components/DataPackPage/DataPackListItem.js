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
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import { List, ListItem} from 'material-ui/List'

export class DataPackListItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            providerDescs: {},
            providerDialogOpen: false,
        };
    }
    handleProviderClose = () => {
        this.setState({providerDialogOpen: false});

    };

    handleProviderOpen(runProviders) {
        let providerDesc = {};
        runProviders.forEach((runProvider) => {
            let a = this.props.providers.find(x => x.slug === runProvider.slug)
            providerDesc[a.name] = a.service_description;
        })
        this.setState({providerDescs:providerDesc, providerDialogOpen: true});

    };

    render() {

        const runProviders = this.props.run.provider_tasks.filter((provider) => {
            return provider.display != false;
        });

        const providersList = Object.entries(this.state.providerDescs).map(([key,value])=>{
            return (
                <ListItem
                    key={key}
                    style={{backgroundColor:'whitesmoke', fontWeight:'bold'}}
                    nestedListStyle={{padding: '0px'}}
                    primaryText={key}
                    initiallyOpen={false}
                    primaryTogglesNestedList={false}
                    nestedItems={[
                        <ListItem
                            key={1}
                            primaryText={<div style={{whiteSpace: 'pre-wrap', fontWeight:'bold'}}>{value}</div>}
                            style={{backgroundColor: 'whitesmoke', fontSize: '14px'}}
                        />
                    ]}
                />

            );
        })

        const providerInfoActions = [
            <RaisedButton
                style={{margin: '10px'}}
                labelStyle={{color: 'whitesmoke', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: '#4598bf'}}
                disableTouchRipple={true}
                label="Close"
                primary={false}
                onTouchTap={this.handleProviderClose.bind(this)}
            />,
        ];

        const width = window.innerWidth;
        const titleFontSize = width < 576 ? '19px' : '23px';
        const subtitleFontSize = width < 576 ? '10px': '14px';
        const subtitleHeight = width < 576 ? '16px': '20px';

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
            eventText: {height: subtitleHeight, lineHeight: subtitleHeight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'},
            titleLink: {color: 'inherit', display: 'block', width: '100%', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}
        };

        return (
            <Card style={styles.card} key={this.props.run.uid} containerStyle={{padding: '0px'}}>
                <CardTitle 
                    titleColor={'#4598bf'}
                    style={styles.cardTitle} 
                    titleStyle={{fontSize: titleFontSize, height: '36px'}}
                    subtitleStyle={{fontSize: subtitleFontSize}}
                    title={
                        <div>
                            <div style={{display: 'inline-block', width: 'calc(100% - 24px)', height: '36px'}}>
                                <Link 
                                    to={'/status/' + this.props.run.job.uid} 
                                    style={styles.titleLink}>
                                    {this.props.run.job.name}
                                </Link>
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
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="Go to Status & Download"
                                    onClick={() => {browserHistory.push('/status/'+this.props.run.job.uid)}}/>
                                <MenuItem
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="View Provider Data"
                                    onClick={this.handleProviderOpen.bind(this, runProviders)}
                                />
                               
                                {this.props.run.user == this.props.user.data.user.username ?
                                <MenuItem
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText={'Delete Export'}
                                    onClick={() => {this.props.onRunDelete(this.props.run.uid)}}/>
                                : null}
                            </IconMenu>
                            <Dialog
                                contentStyle={{width:'70%'}}
                                actions={providerInfoActions}
                                modal={false}
                                open={this.state.providerDialogOpen}
                                onRequestClose={this.handleProviderClose.bind(this)}
                            >
                                <span><strong>PROVIDER DATA</strong><List style={{marginTop:'10px'}}>{providersList}</List></span>
                            </Dialog>
                        </div>
                    } 
                    subtitle={
                        <div>
                            <div style={styles.eventText}>
                                {'Event: ' + this.props.run.job.event}
                            </div>
                            <div style={{height: subtitleHeight, lineHeight: subtitleHeight}}>
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
    providers: PropTypes.array.isRequired
};

export default DataPackListItem;
