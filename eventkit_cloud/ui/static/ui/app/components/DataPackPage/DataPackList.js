import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow } from 'material-ui/Table';
import { GridList } from 'material-ui/GridList';
import NavigationArrowDropDown from '@material-ui/icons/ArrowDropDown';
import NavigationArrowDropUp from '@material-ui/icons/ArrowDropUp';
import { userIsDataPackAdmin } from '../../utils/generic';
import DataPackListItem from './DataPackListItem';
import DataPackTableItem from './DataPackTableItem';
import LoadButtons from './LoadButtons';
import CustomScrollbar from '../CustomScrollbar';

export class DataPackList extends Component {
    constructor(props) {
        super(props);
        this.handleOrder = this.handleOrder.bind(this);
        this.getIcon = this.getIcon.bind(this);
        this.getHeaderStyle = this.getHeaderStyle.bind(this);
        this.isSameOrderType = this.isSameOrderType.bind(this);
    }

    // If it is a 'reversed' order the arrow should be up, otherwise it should be down
    getIcon(order) {
        const style = { verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0' };
        const icon = this.props.order === order ?
            <NavigationArrowDropUp className="qa-DataPackList-NavigationArrowDropUp" style={style} />
            :
            <NavigationArrowDropDown className="qa-DataPackList-NavigationArrowDropDown" style={style} />;
        return icon;
    }

    getHeaderStyle(isActive) {
        return isActive ? { color: '#000', fontWeight: 'bold' } : { color: 'inherit' };
    }

    getScrollbar() {
        return this.scrollbar;
    }

    isSameOrderType(unknown, known) {
        return unknown.replace(/-/, '') === known.replace(/-/, '');
    }

    handleOrder(order) {
        let newOrder = '';
        if (this.isSameOrderType(this.props.order, order)) {
            newOrder = this.props.order.charAt(0) === '-' ? this.props.order.substring(1) : `-${this.props.order}`;
        } else {
            newOrder = order;
        }
        this.props.onSort(newOrder);
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            clickable: {
                cursor: 'pointer',
                width: 'min-content',
            },
            tableRow: {
                marginLeft: '12px',
                paddingRight: '6px',
                color: '#fff',
                height: '50px',
            },
            nameColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                height: 'inherit',
            },
            eventColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                height: 'inherit',
            },
            dateColumn: {
                width: '98px',
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                height: 'inherit',
            },
            statusColumn: {
                width: '65px',
                padding: '0px 0px 0px 10px',
                textAlign: 'center',
                height: 'inherit',
            },
            permissionsColumn: {
                width: '100px',
                padding: '0px 0px 0px 10px',
                textAlign: 'center',
                height: 'inherit',
            },
            ownerColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                height: 'inherit',
            },
            featuredColum: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                height: 'inherit',
                width: '80px',
            },
        };

        const load = (
            <LoadButtons
                style={{ paddingTop: '10px' }}
                range={this.props.range}
                handleLoadLess={this.props.handleLoadLess}
                handleLoadMore={this.props.handleLoadMore}
                loadLessDisabled={this.props.loadLessDisabled}
                loadMoreDisabled={this.props.loadMoreDisabled}
            />
        );

        if (window.innerWidth < 768) {
            return (
                <CustomScrollbar
                    ref={(instance) => { this.scrollbar = instance; }}
                    style={{ height: window.innerWidth > 525 ? window.innerHeight - 236 : window.innerHeight - 225, width: '100%' }}
                >
                    <div style={styles.root} className="qa-DataPackList-root">
                        <GridList
                            className="qa-DataPackList-GridList"
                            cellHeight="auto"
                            cols={1}
                            padding={0}
                            style={{ width: '100%', minWidth: '360px' }}
                        >
                            {this.props.runs.map((run) => {
                                const admin = userIsDataPackAdmin(this.props.user.data.user, run.job.permissions, this.props.groups);
                                return (
                                    <DataPackListItem
                                        run={run}
                                        user={this.props.user}
                                        key={run.uid}
                                        onRunDelete={this.props.onRunDelete}
                                        onRunShare={this.props.onRunShare}
                                        providers={this.props.providers}
                                        adminPermission={admin}
                                        users={this.props.users}
                                        groups={this.props.groups}
                                    />
                                );
                            })}
                            {load}
                        </GridList>
                    </div>
                </CustomScrollbar>
            );
        }

        return (
            <div>
                <div style={styles.root} className="qa-DataPackList-root">
                    <Table className="qa-DataPackList-Table-list">
                        <TableHeader
                            className="qa-DataPackList-TableHeader"
                            displaySelectAll={false}
                            adjustForCheckbox={false}
                            style={{ height: '50px' }}
                        >
                            <TableRow className="qa-DataPackList-TableRow" style={styles.tableRow}>
                                <TableHeaderColumn
                                    className="qa-DataPackList-TableHeaderColumn-name"
                                    style={styles.nameColumn}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('job__name'); }}
                                        onClick={() => { this.handleOrder('job__name'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'job__name'))}>Name</span>
                                        {this.getIcon('-job__name')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn className="qa-DataPackList-TableHeaderColumn-event" style={styles.eventColumn}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('job__event'); }}
                                        onClick={() => { this.handleOrder('job__event'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'job__event'))}>Event</span>
                                        {this.getIcon('-job__event')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn className="qa-DataPackList-TableHeaderColumn-date" style={styles.dateColumn}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('-started_at'); }}
                                        onClick={() => { this.handleOrder('-started_at'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'started_at'))}>
                                            Date Added
                                        </span>
                                        {this.getIcon('started_at')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn className="qa-DataPackList-TableHeaderColumn-status" style={styles.statusColumn}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('status'); }}
                                        onClick={() => { this.handleOrder('status'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'status'))}>
                                            Status
                                        </span>
                                        {this.getIcon('-status')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn
                                    className="qa-DataPackList-TableHeaderColumn-permission"
                                    style={styles.permissionsColumn}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('job__published'); }}
                                        onClick={() => { this.handleOrder('job__published'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'job__published'))}>
                                            Permissions
                                        </span>
                                        {this.getIcon('-job__published')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn className="qa-DataPackList-TableHeaderColumn-owner" style={styles.ownerColumn}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('user__username'); }}
                                        onClick={() => { this.handleOrder('user__username'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'user__username'))}>
                                            Owner
                                        </span>
                                        {this.getIcon('-user__username')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn className="qa-DataPackList-TableHeaderColumn-featured" style={styles.featuredColum}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onKeyPress={() => { this.handleOrder('-job_featured'); }}
                                        onClick={() => { this.handleOrder('-job__featured'); }}
                                        style={styles.clickable}
                                    >
                                        <span style={this.getHeaderStyle(this.isSameOrderType(this.props.order, 'job__featured'))}>
                                            Featured
                                        </span>
                                        {this.getIcon('job__featured')}
                                    </div>
                                </TableHeaderColumn>
                                <TableHeaderColumn style={{ padding: '0px', width: '35px', height: 'inherit' }} />
                            </TableRow>
                        </TableHeader>
                    </Table>
                    <CustomScrollbar
                        ref={(instance) => { this.scrollbar = instance; }}
                        style={{ height: window.innerHeight - 287 }}
                    >
                        <Table className="qa-DataPackList-Table-item">
                            <TableBody displayRowCheckbox={false}>
                                {this.props.runs.map((run) => {
                                    const admin = userIsDataPackAdmin(this.props.user.data.user, run.job.permissions, this.props.groups);
                                    return (
                                        <DataPackTableItem
                                            run={run}
                                            user={this.props.user}
                                            key={run.uid}
                                            onRunDelete={this.props.onRunDelete}
                                            onRunShare={this.props.onRunShare}
                                            providers={this.props.providers}
                                            adminPermissions={admin}
                                            users={this.props.users}
                                            groups={this.props.groups}
                                        />
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {load}
                    </CustomScrollbar>
                </div>
            </div>
        );
    }
}

DataPackList.propTypes = {
    runs: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onRunShare: PropTypes.func.isRequired,
    onSort: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func.isRequired,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool.isRequired,
    loadMoreDisabled: PropTypes.bool.isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
};

export default DataPackList;

