import React, {PropTypes, Component} from 'react'
import {Link} from 'react-router';
import {browserHistory} from 'react-router';
import {TableRow, TableRowColumn} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import { List, ListItem} from 'material-ui/List'
import moment from 'moment';
import CustomScrollbar from '../CustomScrollbar';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            providerDescs: {},
            providerDialogOpen: false,
        };
    }

    getOwnerText(run, user) {
        return run.user == user ? 'My DataPack' : run.user;
    }

    getPermissionsIcon(published) {
        return published ? <SocialGroup style={{color: 'bcdfbb'}}/> 
        : <SocialPerson style={{color: 'grey'}}/>;
    }

    getStatusIcon(status) {
        if(status == 'SUBMITTED') {
            return <NotificationSync style={{color: '#f4d225'}}/>
        }
        else if(status == 'INCOMPLETE') {
            return <AlertError style={{color: '#ce4427', opacity: '0.6', height: '22px'}}/>
        }
        else {
            return <NavigationCheck style={{color: '#bcdfbb', height: '22px'}}/>
        }
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

        const styles = {
            headerColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center',},
            rowColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center'},
            dropDownArrow: {
                verticalAlign: 'middle',
                marginBottom: '2px',
                fill: '#4498c0',
            }
        };

        return (
            <TableRow>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', color: '#4598bf'}}>
                    <Link to={'/status/' + this.props.run.job.uid} style={{color: 'inherit'}}>{this.props.run.job.name}</Link>
                </TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', color: 'grey'}}>
                    {this.props.run.job.event}
                </TableRowColumn>
                <TableRowColumn style={{width: '98px', padding: '0px 0px 0px 10px', textAlign: 'left', color: 'grey'}}>
                    {moment(this.props.run.started_at).format('YYYY-MM-DD')}
                </TableRowColumn>
                <TableRowColumn style={{width: '65px', padding: '0px 0px 0px 0px', textAlign: 'center'}}>
                    {this.getStatusIcon(this.props.run.status)}
                </TableRowColumn>
                <TableRowColumn style={{width: '100px' ,padding: '0px 0px 0px 0px',textAlign: 'center'}}>
                    {this.getPermissionsIcon(this.props.run.job.published)}
                </TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left'}}>
                    {this.getOwnerText(this.props.run, this.props.user.data.user.username)}
                </TableRowColumn>
                <TableRowColumn style={{paddingRight: '10px', paddingLeft: '0px', width: '30px'}}>
                    <IconMenu
                        iconButtonElement={
                            <IconButton 
                                style={{padding: '0px', width: '20px', verticalAlign: 'middle'}}
                                iconStyle={{color: '#4598bf'}}>
                                <NavigationMoreVert />
                            </IconButton>}
                        anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
                        targetOrigin={{horizontal: 'right', vertical: 'top'}}
                    >
                        <MenuItem 
                            style={{fontSize: '12px'}}
                            primaryText="Go to Status & Download"
                            onClick={() => {browserHistory.push('/status/'+this.props.run.job.uid)}}/>
                        <MenuItem
                            style={{fontSize: '12px'}}
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
                </TableRowColumn>
            </TableRow>
        )
    }
}

DataPackTableItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    providers: PropTypes.array.isRequired
};

export default DataPackTableItem;

