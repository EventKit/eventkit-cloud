import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {getRuns, deleteRuns} from '../../actions/DataPackListActions';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import Drawer from 'material-ui/Drawer';
import PermissionFilter from './PermissionsFilter';
import StatusFilter from './StatusFilter';
import DateFilter from './DateFilter';
import FilterHeader from './FilterHeader';
import DataPackList from './DataPackList';
import primaryStyles from '../../styles/constants.css'
import DataPackSearchbar from './DataPackSearchbar';
import DataPackViewButtons from './DataPackViewButtons';
import DataPackSortDropDown from './DataPackSortDropDown';
import DataPackFilterButton from './DataPackFilterButton';
import DataPackOwnerSort from './DataPackOwnerSort';
import DataPackLinkButton from './DataPackLinkButton';
import * as utils from '../../utils/sortUtils';

export class DataPackPage extends React.Component {

    constructor(props) {
        super(props);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleOwnerFilter = this.handleOwnerFilter.bind(this);
        this.applySorts = this.applySorts.bind(this);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleMinDate = this.handleMinDate.bind(this);
        this.handleMaxDate = this.handleMaxDate.bind(this);
        this.applyAll = this.applyAll.bind(this);
        this.state = {
            open: window.innerWidth > 991 ? true : false,
            runs: [],
            displayedRuns: [],
            dropDownValue: 1,
            sortDropDown: utils.orderNewest,
            search: {
                searched: false,
                searchQuery: ''
            },
            ordered: utils.orderNewest,
            permissions: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                running: false,
            },
            filtersApplied: false,
        }
    }

    componentWillReceiveProps(nextProps) { 
        if(nextProps.runsList.fetched != this.props.runsList.fetched) { 
            if (nextProps.runsList.fetched == true) {
                let runs = nextProps.runsList.runs;
                this.setState({runs: runs});
                runs = this.applyAll(runs);
                this.setState({displayedRuns:runs});
                
            }
        }
        if (nextProps.runsDeletion.deleted != this.props.runsDeletion.deleted) {
            if(nextProps.runsDeletion.deleted) {
                this.props.getRuns();
            }
        }
    }

    componentWillMount() {
        this.props.getRuns();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    onSearch(searchText, ix) { 
        this.setState({search: {searched: true, searchQuery: searchText}});
        const searched = utils.search(searchText, this.state.displayedRuns);
        this.setState({displayedRuns: searched});
    }

    checkForEmptySearch(searchText, dataSource, params) {
        if(searchText == '') {
            this.setState({search: {searched: false, searchQuery: ''}}, () => {
                let runs = this.applySorts(this.state.runs);
                runs = this.applyFilters(runs);
                this.setState({displayedRuns: runs});
            });
        }
    }

    handleSortChange = (event, index, value) => {
        this.setState({sortDropDown: value});
        const runs = value(this.state.displayedRuns);
        this.setState({displayedRuns: runs});
    }

    handleOwnerFilter = (event, index, value) => {
        if(value == 1) {
            this.setState({dropDownValue: value}, () => {
                let runs = this.applyAll(this.state.runs);
                this.setState({displayedRuns: runs});
            }); 
        }
        else {
            this.setState({dropDownValue: value});
            const filteredRuns = utils.myDataPacksOnly(this.state.displayedRuns, this.props.user.data.username);
            this.setState({displayedRuns: filteredRuns});
        }
    }

    applyAll(runs) {
        runs = this.applySearch(runs);
        runs = this.applyFilters(runs);
        runs = this.applySorts(runs);
        return runs;
    }

    applySorts(runs) {
        if(this.state.dropDownValue == 2) {
            runs = utils.myDataPacksOnly(runs, this.props.user.data.username);
        }
        runs = this.state.sortDropDown(runs);
        return runs;
    }

    applySearch(runs) {
        if(this.state.search.searched) {
            return utils.search(this.state.search.searchQuery, runs);
        }
        else return runs;
    }

    applyFilters(runs) {
        if(this.state.permissions) {
            runs = utils.filterPermissions(this.state.permissions, runs);
        }
        if(this.state.status.completed || this.state.status.incomplete || this.state.status.running)  {
            runs = utils.filterStatus(this.state.status, runs);
        }
        if(this.state.minDate || this.state.maxDate) {
            runs = utils.filterDate(this.state.minDate, this.state.maxDate, runs);
        }
        return runs
    }

    handleFilterApply = () => {
        if(window.innerWidth <= 991) {
            this.setState({open: false});
        }
        this.setState({filtersApplied: true});
        let runs = this.applyAll(this.state.runs);
        this.setState({displayedRuns: runs});
    }

    handleFilterClear = () => {
        this.setState({
            permissions: null,
            status: {
                completed: false,
                incomplete: false,
                running: false,
            },
            minDate: null,
            maxDate: null,
            filtersApplied: false,
        });
        if(window.innerWidth <= 991) {
            this.setState({open: false});
        }
        let runs = this.applySearch(this.state.runs);
        runs = this.applySorts(runs);
        this.setState({displayedRuns: runs});
    }

    handlePermissionsChange = (event, value) => {
        this.setState({permissions: value});
    }

    handleStatusChange = (stateChange) => {
        let status = this.state.status;
        status = Object.assign(status, stateChange)
        this.setState({status: status});
    }

    handleMinDate = (e, date) => {
         this.setState({minDate: date});
    }

    handleMaxDate = (e, date) => {
        this.setState({maxDate: date});
    }

    handleToggle = () => {
        this.setState({open: !this.state.open});
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    render() { 
        const pageTitle = "DataPack Library"
        const styles = {
            wholeDiv: {
                height: window.innerHeight - 221,
                overflowY: 'auto',
                backgroundRepeat: 'repeat repeat',
                marginRight: this.state.open && window.innerWidth > 991 ? '200px' : '0px',
                paddingTop: '10px',
            },
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            toolbarSearch: {
                backgroundColor: '#253447',
            },
            toolbarSort: {
                backgroundColor: '#253447',
                height: '35px',
                display: 'inline-block',
                width: '100%'
            },
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'auto',
                overflowX: 'hidden'
            }
        };

        return (
            <div style={{backgroundImage: "url('./images/ek_topo_pattern.png')"}}>
                <AppBar 
                    className={primaryStyles.sectionTitle} 
                    style={styles.appBar} title={pageTitle}
                    iconElementLeft={<p></p>}
                >
                    <DataPackLinkButton />
                </AppBar>
                <Toolbar style={styles.toolbarSearch}>
                    <ToolbarGroup style={{margin: 'auto', width: '100%'}}>
                        <DataPackSearchbar
                            onSearchChange={this.checkForEmptySearch}
                            onSearchSubmit={this.onSearch}
                            searchbarWidth={'100%'} 
                        />
                    </ToolbarGroup>
                </Toolbar>

                <Toolbar style={styles.toolbarSort}>
                        <DataPackOwnerSort handleChange={this.handleOwnerFilter} value={this.state.dropDownValue} />
                        <DataPackFilterButton open={this.state.open} handleToggle={this.handleToggle} />
                        <DataPackSortDropDown handleChange={this.handleSortChange} value={this.state.sortDropDown} />
                        <DataPackViewButtons handleGridSelect={() => {console.log('grid')}} handleListSelect={() => {console.log('list')}} />
                </Toolbar>
                <div style={styles.wholeDiv}>
                    <Drawer 
                        width={200} 
                        openSecondary={true} 
                        open={this.state.open}
                        containerStyle={styles.containerStyle}>
                        <FilterHeader
                            onApply={this.handleFilterApply}
                            onClear={this.handleFilterClear}
                        />
                        <PermissionFilter
                            onChange={this.handlePermissionsChange}
                            valueSelected={this.state.permissions}
                        />
                        <StatusFilter
                            onChange={this.handleStatusChange}
                            completed={this.state.status.completed}
                            incomplete={this.state.status.incomplete}
                            running={this.state.status.running}
                        />
                        <DateFilter
                            onMinChange={this.handleMinDate}
                            onMaxChange={this.handleMaxDate}
                            minDate={this.state.minDate}
                            maxDate={this.state.maxDate}
                        />
                    </Drawer>
                    <DataPackList 
                        runs={this.state.displayedRuns} 
                        user={this.props.user} 
                        onRunDelete={this.props.deleteRuns}/>
                    <div >
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}


DataPackPage.propTypes = {
    runsList: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    getRuns: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
    runsDeletion: PropTypes.object.isRequired,
    drawerOpen: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return {
        runsList: state.runsList,
        user: state.user,
        runsDeletion: state.runsDeletion,
        drawerOpen: state.drawerOpen,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: () => {
            dispatch(getRuns());
        },
        deleteRuns: (uid) => {
            dispatch(deleteRuns(uid));
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DataPackPage);
