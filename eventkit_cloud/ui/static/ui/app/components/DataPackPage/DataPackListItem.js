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
import CustomScrollbar from '../CustomScrollbar';

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

        const providersList = Object.entries(this.state.providerDescs).map(([key,value], ix)=>{
            return (
                <ListItem
                    key={key}
                    style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white', fontWeight:'bold', width:'95%'}}
                    nestedListStyle={{padding: '0px'}}
                    primaryText={key}
                    initiallyOpen={false}
                    primaryTogglesNestedList={false}
                    nestedItems={[
                        <ListItem
                            key={1}
                            primaryText={<div style={{whiteSpace: 'pre-wrap', fontWeight:'bold'}}>{value}</div>}
                            style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white', fontSize: '14px', width:'95%'}}
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
                backgroundColor: this.props.backgroundColor || '#f7f8f8',
                borderRadius: '0px',
                borderTop: 'grey 1px solid',
                paddingBottom: '0px',
            },
            cardTitle:{
                wordWrap: 'break-word',
                padding: '10px 15px',
            },
            completeIcon: {
                height: '18px', 
                float: 'right', 
                color: '#bcdfbb', 
                opacity: '0.6'
            },
            errorIcon: {
                height: '18px', 
                float: 'right', 
                color: '#ce4427', 
                opacity: '0.6'
            },
            runningIcon: {
                height: '18px', 
                float: 'right', 
                color: '#f4D225'
            },
            unpublishedIcon: {
                height: '18px', 
                float: 'right', 
                color: 'grey', 
                marginRight: '5px'
            },
            publishedIcon : {
                height: '18px', 
                float: 'right', 
                color: '#bcdfbb', 
                marginRight: '5px'
            },
            ownerLabel: {
                float: 'right', 
                color: 'grey'
            },
            eventText: {
                height: '18px', 
                lineHeight: '18px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap'
            },
            titleLink: {
                height: '36px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap'
            }
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
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="Go to Status & Download"
                                    onClick={() => {browserHistory.push('/status/'+this.props.run.job.uid)}}/>
                                <MenuItem
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="View Data Sources"
                                    onClick={this.handleProviderOpen.bind(this, runProviders)}
                                />

                                {this.props.run.user == this.props.user.data.user.username ?
                                <MenuItem
                                    style={{fontSize: '12px'}}
                                    primaryText={'Delete Export'}
                                    onClick={() => {this.props.onRunDelete(this.props.run.uid)}}/>
                                : null}
                            </IconMenu>
                            <Dialog
                                contentStyle={{width:'70%', minWidth:'300px', maxWidth:'610px'}}
                                actions={providerInfoActions}
                                modal={false}
                                open={this.state.providerDialogOpen}
                                onRequestClose={this.handleProviderClose.bind(this)}
                            >
                                <span><strong>DATA SOURCES</strong>
                                    <CustomScrollbar style={{height: '200px', overflowX: 'hidden', width:'100%'}}>
                                        <List style={{marginTop:'10px'}}>{providersList}</List>
                                    </CustomScrollbar>
                                </span>
                            </Dialog>
                        </div>
                    } 
                    subtitle={
                        <div>
                            <div style={styles.eventText}>
                                {'Event: ' + this.props.run.job.event}
                            </div>
                            <div style={{lineHeight: '18px', display: 'inline-block', width: '100%'}}>
                                {'Added: ' + moment(this.props.run.started_at).format('YYYY-MM-DD')}
                                {this.props.run.user == this.props.user.data.user.username ?
                                    <div style={styles.ownerLabel}>My DataPack</div>
                                    :
                                    <div style={styles.ownerLabel}>{this.props.run.user}</div>
                                }
                                <div style={{display: 'inline-block', float: 'right'}}>
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
    providers: PropTypes.array.isRequired,
    onHoverStart: PropTypes.func,
    onHoverEnd: PropTypes.func,
    onClick: PropTypes.func,
    backgroundColor: PropTypes.string
};

export default DataPackListItem;
