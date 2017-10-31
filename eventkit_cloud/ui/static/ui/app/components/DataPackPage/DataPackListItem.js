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
import { List, ListItem} from 'material-ui/List'
import CustomScrollbar from '../CustomScrollbar';
import BaseDialog from '../BaseDialog';
import DeleteDialog from '../DeleteDialog';
import FeaturedFlag from './FeaturedFlag';

export class DataPackListItem extends Component {
    constructor(props) {
        super(props);
        this.showDeleteDialog =  this.showDeleteDialog.bind(this);
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.state = {
            providerDescs: {},
            providerDialogOpen: false,
            deleteDialogOpen: false
        };
    }
    handleProviderClose() {
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

    handleMenuButtonClick(e) {
        e.stopPropagation();
    }

    showDeleteDialog() {
        this.setState({deleteDialogOpen: true});
    }

    hideDeleteDialog() {
        this.setState({deleteDialogOpen: false});
    }

    handleDelete() {
        this.hideDeleteDialog();
        this.props.onRunDelete(this.props.run.uid);
    }

    render() {

        const runProviders = this.props.run.provider_tasks.filter((provider) => {
            return provider.display != false;
        });

        const providersList = Object.entries(this.state.providerDescs).map(([key,value], ix)=>{
            return (
                <ListItem
                    className={'qa-DataPackListItem-ListItem'}
                    key={key}
                    style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white', fontWeight:'bold', width:'100%', zIndex: 0}}
                    nestedListStyle={{padding: '0px'}}
                    primaryText={key}
                    initiallyOpen={false}
                    primaryTogglesNestedList={false}
                    nestedItems={[
                        <ListItem
                            className={'qa-DataPackListItem-NestedListItem'}
                            key={1}
                            primaryText={<div style={{whiteSpace: 'pre-wrap', fontWeight:'bold'}}>{value}</div>}
                            style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white', fontSize: '14px', width:'100%', zIndex: 0}}
                        />
                    ]}
                />

            );
        })

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
                position: 'relative'
            },
            cardTitle:{
                wordWrap: 'break-word',
                padding: '8px 15px 15px',
            },
            cardTitleFeatured: {
                wordWrap: 'break-word',
                padding: '15px',
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

        const cardTitleStyle = (this.props.run.job.featured) ? styles.cardTitleFeatured : styles.cardTitle;

        const onMouseEnter = this.props.onHoverStart ? () => {this.props.onHoverStart(this.props.run.uid)} : null;
        const onMouseLeave = this.props.onHoverEnd ? () => {this.props.onHoverEnd(this.props.run.uid)} : null;
        const onClick = this.props.onClick ? () => {this.props.onClick(this.props.run.uid)} : null;
        return (
            <Card
                className={'qa-DataPackListItem-Card'}
                style={styles.card}
                key={this.props.run.uid}
                containerStyle={{padding: '0px'}}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
            >
                <FeaturedFlag show={this.props.run.job.featured}/>
                <CardTitle
                    className={'qa-DataPackListItem-CardTitle'}
                    titleColor={'#4598bf'}
                    style={cardTitleStyle}
                    titleStyle={{fontSize: '21px', height: '36px'}}
                    subtitleStyle={{fontSize: '12px'}}
                    title={
                        <div>
                            <div style={{display: 'inline-block', width: 'calc(100% - 24px)', height: '36px'}}>
                                <div className={'qa-DataPackListItem-titleLink'} style={styles.titleLink}>
                                    <Link
                                        to={'/status/' + this.props.run.job.uid}
                                        style={{color: 'inherit'}}>
                                        {this.props.run.job.name}
                                    </Link>
                                </div>
                            </div>
                            <IconMenu
                                className={'qa-DataPackListItem-IconMenu'}
                                style={{float: 'right', width: '24px', height: '100%'}}
                                iconButtonElement={
                                    <IconButton
                                        className={'qa-DataPackListItem-IconButton'}
                                        style={{padding: '0px', width: '24px', height: '24px', verticalAlign: 'middle'}}
                                        iconStyle={{color: '#4598bf'}}
                                        onClick={this.handleMenuButtonClick}>
                                        <NavigationMoreVert className={'qa-DataPackListItem-NavigationMoreVert'}/>
                                    </IconButton>}
                                anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                targetOrigin={{horizontal: 'right', vertical: 'top'}}
                            >
                                <MenuItem
                                    className={'qa-DataPackListItem-MenuItem-statusDownloadLink'}
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="Go to Status & Download"
                                    onClick={() => {browserHistory.push('/status/'+this.props.run.job.uid)}}/>
                                <MenuItem
                                    className={'qa-DataPackListItem-MenuItem-viewDataSources'}
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText="View Data Sources"
                                    onClick={this.handleProviderOpen.bind(this, runProviders)}
                                />

                                {this.props.run.user == this.props.user.data.user.username ?
                                <MenuItem
                                    className={'qa-DataPackListItem-MenuItem-deleteExport'}
                                    style={{fontSize: subtitleFontSize}}
                                    primaryText={'Delete Export'}
                                    onClick={this.showDeleteDialog}/>
                                : null}
                            </IconMenu>
                            <BaseDialog
                                className={'qa-DataPackListItem-BaseDialog'}
                                show={this.state.providerDialogOpen}
                                title={'DATA SOURCES'}
                                onClose={this.handleProviderClose.bind(this)}
                            >
                                <List>{providersList}</List>
                            </BaseDialog>
                            <DeleteDialog
                                className={'qa-DataPackListItem-DeleteDialog'}
                                show={this.state.deleteDialogOpen}
                                handleCancel={this.hideDeleteDialog}
                                handleDelete={this.handleDelete}
                            />
                        </div>
                    } 
                    subtitle={
                        <div>
                            <div className={'qa-DataPackListItem-subtitle-event'} style={styles.eventText}>
                                {'Event: ' + this.props.run.job.event}
                            </div>
                            <div className={'qa-DataPackListItem-subtitle-date'} style={{lineHeight: '18px', display: 'inline-block', width: '100%'}}>
                                {'Added: ' + moment(this.props.run.started_at).format('YYYY-MM-DD')}
                                {this.props.run.user == this.props.user.data.user.username ?
                                    <div style={styles.ownerLabel}>My DataPack</div>
                                    :
                                    <div style={styles.ownerLabel}>{this.props.run.user}</div>
                                }
                                <div className={'qa-DataPackListItem-subtitle-status'} style={{display: 'inline-block', float: 'right'}}>
                                {this.props.run.job.published ?
                                    <SocialGroup className={'qa-DataPackListItem-SocialGroup'} style={styles.publishedIcon}/>
                                    :
                                    
                                    <SocialPerson className={'qa-DataPackListItem-SocialPerson'} style={styles.unpublishedIcon}/>
                                }
                                {this.props.run.status == "SUBMITTED" ?
                                    <NotificationSync className={'qa-DataPackListItem-NotificationSync'} style={styles.runningIcon}/>
                                    :
                                    this.props.run.status == "INCOMPLETE"  ?
                                        <AlertError className={'qa-DataPackListItem-AlertError'} style={styles.errorIcon}/>
                                        :
                                        <NavigationCheck className={'qa-DataPackListItem-NavigationCheck'} style={styles.completeIcon}/>
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
