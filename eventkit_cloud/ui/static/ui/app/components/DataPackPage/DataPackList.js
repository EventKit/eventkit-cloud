import React, {PropTypes, Component} from 'react'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow} from 'material-ui/Table';
import {GridList} from 'material-ui/GridList'
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import DataPackListItem from './DataPackListItem';
import DataPackTableItem from './DataPackTableItem';
import * as sorts from '../../utils/sortUtils';

export class DataPackList extends Component {
    constructor(props) {
        super(props);
        this.handleNameSort = this.handleNameSort.bind(this);
        this.handleEventSort = this.handleEventSort.bind(this);
        this.handleDateSort = this.handleDateSort.bind(this);
        this.handleStatusSort = this.handleStatusSort.bind(this);
        this.handlePermissionsSort = this.handlePermissionsSort.bind(this);
        this.handleOwnerSort = this.handleOwnerSort.bind(this);
        this.isNameActive = this.isNameActive.bind(this);
        this.isEventActive = this.isEventActive.bind(this);
        this.isDateActive = this.isDateActive.bind(this);
        this.isStatusActive = this.isStatusActive.bind(this);
        this.isPermissionsActive = this.isPermissionsActive.bind(this);
        this.isOwnerActive = this.isOwnerActive.bind(this);
        this.getIcon = this.getIcon.bind(this);
        this.getHeaderStyle = this.getHeaderStyle.bind(this);
        this.state = {
            activeSort: sorts.orderNewest,
        }
    }

    handleNameSort() {
        let sort;
        if(!this.isNameActive()) {
            sort = sorts.orderAZ;
        }
        else {
            sort = this.state.activeSort == sorts.orderAZ ? sorts.orderZA : sorts.orderAZ;
        }
        this.props.onSort(sort)
        this.setState({
            activeSort: sort
        });
    }

    handleEventSort() {
        let sort;
        if(!this.isEventActive()){
            sort = sorts.orderEventAZ;
        }
        else {
            sort = this.state.activeSort == sorts.orderEventAZ ? sorts.orderEventZA : sorts.orderEventAZ;
        }
        this.props.onSort(sort);
        this.setState({
            activeSort: sort
        });
    }

    handleDateSort() {
        let sort;
        if(!this.isDateActive()) {
            sort = sorts.orderNewest;
        }
        else{ 
            sort = this.state.activeSort == sorts.orderNewest ? sorts.orderOldest : sorts.orderNewest;
        }
        this.props.onSort(sort);
        this.setState({
            activeSort: sort
        });
    }

    handleStatusSort() {
        let sort;
        if(!this.isStatusActive()) {
            sort = sorts.orderComplete;
        }
        else {
            sort = this.state.activeSort == sorts.orderComplete ? sorts.orderIncomplete : sorts.orderComplete;
        }
        this.props.onSort(sort);
        this.setState({
            activeSort: sort
        });
    }

    handlePermissionsSort() {
        let sort;
        if(!this.isPermissionsActive()) {
            sort = sorts.orderPrivate;
        }
        else {
            sort = this.state.activeSort == sorts.orderPrivate ? sorts.orderPublic : sorts.orderPrivate;
        }
        this.props.onSort(sort);
        this.setState({
            activeSort: sort
        });
    }

    handleOwnerSort() {
        let sort;
        if(!this.isOwnerActive()) {
            sort = sorts.orderOwnerAZ;
        }
        else {
            sort = this.state.activeSort == sorts.orderOwnerAZ ? sorts.orderOwnerZA : sorts.orderOwnerAZ
        }
        this.props.onSort(sort);
        this.setState({
            activeSort: sort
        });
    }

    isNameActive() {
        return this.state.activeSort == sorts.orderAZ || this.state.activeSort == sorts.orderZA;
    }
    isEventActive() {
        return this.state.activeSort == sorts.orderEventAZ || this.state.activeSort == sorts.orderEventZA;
    }
    isDateActive() {
        return this.state.activeSort == sorts.orderNewest || this.state.activeSort == sorts.orderOldest;
    }
    isStatusActive() {
        return this.state.activeSort == sorts.orderComplete || this.state.activeSort == sorts.orderIncomplete;
    }
    isPermissionsActive() {
        return this.state.activeSort == sorts.orderPrivate || this.state.activeSort == sorts.orderPublic;
    }
    isOwnerActive() {
        return this.state.activeSort == sorts.orderOwnerAZ || this.state.activeSort == sorts.orderOwnerZA;
    }

    //If it is a 'reversed' sort the arrow should be up, otherwise it should be down
    getIcon(sortFunction) {
        const style = {verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0'};
        const icon = this.state.activeSort == sortFunction ?
            <NavigationArrowDropUp style={style}/>
            :
            <NavigationArrowDropDown style={style}/>
        return icon;
    }

    getHeaderStyle(isActive) {
        return isActive ? {color: '#000', fontWeight: 'bold'} : {color: 'inherit'}
    }

    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: '5px',
                marginRight: '5px',
                paddingBottom: '10px'
            },
            clickable: {cursor: 'pointer', width: 'min-content'},
            tableRow: {marginLeft: '12px', paddingRight: '6px', color: '#fff', height: '50px'},
            nameColumn: {padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'},
            eventColumn: {padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'},
            dateColumn: {width: '98px', padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'},
            statusColumn: {width: '65px' ,padding: '0px 0px 0px 10px', textAlign: 'center', height: 'inherit'},
            permissionsColumn: {width: '100px', padding: '0px 0px 0px 10px', textAlign: 'center', height: 'inherit'},
            ownerColumn: {padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'},
        };
        return (
            <div style={styles.root}>
            {window.innerWidth < 768 ?
                <GridList
                    cellHeight={'auto'}
                    cols={1}
                    padding={0}
                    style={{width: window.innerWidth - 10, minWidth: '360px'}}
                >   
                    {this.props.runs.map((run) => (
                        <DataPackListItem 
                            run={run} 
                            user={this.props.user} 
                            key={run.uid}
                            onRunDelete={this.props.onRunDelete}/>
                    ))}
                </GridList>
            :
                <Table height={49 * this.props.runs.length > window.innerHeight - 297 ? `${window.innerHeight - 297}px` : 'inherit'} selectable={false}>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false} style={{height: '50px'}}>
                        <TableRow style={styles.tableRow}>
                            <TableHeaderColumn 
                                style={styles.nameColumn}>
                                <div onClick={this.handleNameSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isNameActive())}>Name</span>
                                    {this.getIcon(sorts.orderZA)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={styles.eventColumn}>
                                <div onClick={this.handleEventSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isEventActive())}>Event</span>
                                    {this.getIcon(sorts.orderEventZA)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={styles.dateColumn}>
                                <div onClick={this.handleDateSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isDateActive())}>Date Added</span>
                                    {this.getIcon(sorts.orderOldest)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={styles.statusColumn}>
                                <div onClick={this.handleStatusSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isStatusActive())}>Status</span>
                                    {this.getIcon(sorts.orderIncomplete)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={styles.permissionsColumn}>
                                <div onClick={this.handlePermissionsSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isPermissionsActive())}>Permissions</span>
                                    {this.getIcon(sorts.orderPublic)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={styles.ownerColumn}>
                                <div onClick={this.handleOwnerSort} style={styles.clickable}>
                                    <span style={this.getHeaderStyle(this.isOwnerActive())}>Owner</span>
                                    {this.getIcon(sorts.orderOwnerZA)}
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{padding: '0px', width: '30px', height: 'inherit'}}/>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.props.runs.map((run) => (
                            <DataPackTableItem 
                                run={run} 
                                user={this.props.user} 
                                key={run.uid}
                                onRunDelete={this.props.onRunDelete}
                            />
                        ))}
                    </TableBody>
                </Table>
            }
            </div>
        )
    }
}

DataPackList.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onSort: PropTypes.func.isRequired,
};

export default DataPackList;

