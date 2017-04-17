import React, {PropTypes, Component} from 'react'
import {Link} from 'react-router';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {GridList} from 'material-ui/GridList'
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import moment from 'moment';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
    }

    getOwnerText(run, user) {
        return run.user == user ? 'My DataPack' : user;
    }

    getPermissionsIcon(published) {
        return published ? <SocialGroup style={{color: 'bcdfbb'}}/> 
        : <SocialPerson style={{color: 'grey'}}/>;
    }

    getStatusIcon(status, name) {
        if(status == 'SUBMITTED' || name == 'Centreville') {
            return <NotificationSync style={{color: '#f4d225'}}/>
        }
        else if(status == 'INCOMPLETE' || name == 'Fairfax City') {
            return <AlertError style={{color: '#ce4427', opacity: '0.6', height: '22px'}}/>
        }
        else {
            return <NavigationCheck style={{color: '#bcdfbb', opacity: '0.6', height: '22px'}}/>
        }
    }

    render() {
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
                    <Link to={'/exports/' + this.props.run.uid} style={{color: 'inherit'}}>{this.props.run.job.name}</Link>
                </TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', color: 'grey'}}>
                    {this.props.run.job.event}
                </TableRowColumn>
                <TableRowColumn style={{width: '98px', padding: '0px 0px 0px 10px', textAlign: 'left', color: 'grey'}}>
                    {moment(this.props.run.started_at).format('YYYY-MM-DD')}
                </TableRowColumn>
                <TableRowColumn style={{width: '65px', padding: '0px 0px 0px 0px', textAlign: 'center'}}>
                    {this.getStatusIcon(this.props.run.status, this.props.run.job.name)}
                </TableRowColumn>
                <TableRowColumn style={{width: '100px' ,padding: '0px 0px 0px 0px',textAlign: 'center'}}>
                    {this.getPermissionsIcon(this.props.run.job.published)}
                </TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left'}}>
                    {this.getOwnerText(this.props.run, this.props.user.data.username)}
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
                            primaryText="Go to Export Detail"
                            onClick={() => {window.location.href='/exports/' + this.props.run.uid}}/>
                        
                        {this.props.run.user == this.props.user.data.username ?
                        <MenuItem
                            style={{fontSize: '12px'}}
                            primaryText={'Delete Export'}
                            onClick={() => {this.props.onRunDelete(this.props.run.uid)}}/>
                        : null}
                    </IconMenu>
                </TableRowColumn>
            </TableRow>
        )
    }
}

DataPackTableItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
};

export default DataPackTableItem;

