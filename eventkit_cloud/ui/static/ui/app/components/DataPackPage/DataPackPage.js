import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {getRuns, deleteRuns} from '../../actions/DataPackListActions';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
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
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.state = {
            open: false,
            runs: [],
            displayedRuns: [],
            dropDownValue: 1,
            sortDropDown: utils.orderNewest,
            search: {
                searched: false,
                searchQuery: ''
            },
            ordered: utils.orderNewest
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.runsList.fetched != this.props.runsList.fetched) {
            if (nextProps.runsList.fetched == true) {
                let runs = nextProps.runsList.runs;
                this.setState({runs: runs});
                this.applyFilters(runs);      
                
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

    screenSizeUpdate() {
        this.forceUpdate();
    }

    onSearch(searchText, ix) {
        this.setState({search: {searched: true, searchQuery: searchText}});
        const searched = utils.search(searchText, this.state.displayedRuns);
        this.setState({displayedRuns: searched});
    }

    

    checkForEmptySearch(searchText, dataSource, params) {
        if(searchText == '') {
            this.setState({search: {searched: false, searchQuery: ''}}, () => {
                this.applyFilters(this.state.runs);
            });
        }
    }

    handleSortChange = (event, index, value) => {
        this.setState({sortDropDown: value});
        const runs = value(this.state.displayedRuns);
        this.setState({displayedRuns: runs});
    }

    handleDropDownChange = (event, index, value) => {
        if(value == 1) {
            this.setState({dropDownValue: value}, () => {
                this.applyFilters(this.state.runs);
            });
            
        }
        else {
            this.setState({dropDownValue: value});
            const filteredRuns = utils.myDataPacksOnly(this.state.displayedRuns, this.props.user.data.username);
            this.setState({displayedRuns: filteredRuns});
        }
    }

    applyFilters(runs) {
        // run functions that remove first
        if(this.state.search.searched) {
            runs = utils.search(this.state.search.searchQuery, runs);
        }
        if(this.state.dropDownValue == 2) {
            runs = utils.myDataPacksOnly(runs, this.props.user.data.username);
        }
        runs = this.state.sortDropDown(runs);
        this.setState({displayedRuns: runs});
    }

    handleToggle = () => {
        this.setState({open: !this.state.open});
    }

    render() {

        const pageTitle = "DataPack Library"
        const styles = {
            wholeDiv: {
                width:'100%',
                height: window.innerHeight - 221,
                overflowY: 'scroll',
                backgroundRepeat: 'repeat repeat',
                paddingBottom: '30px',
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
        };

        return (
            <div>
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
                        <DataPackOwnerSort handleChange={this.handleDropDownChange} value={this.state.dropDownValue} />
                        <DataPackFilterButton open={this.state.open} handleToggle={this.handleToggle} />
                        <DataPackSortDropDown handleChange={this.handleSortChange} value={this.state.sortDropDown} />
                        <DataPackViewButtons handleGridSelect={() => {console.log('grid')}} handleListSelect={() => {console.log('list')}} />
                </Toolbar>
                
                <div style={styles.wholeDiv}>
                    
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
};

function mapStateToProps(state) {
    return {
        runsList: state.runsList,
        user: state.user,
        runsDeletion: state.runsDeletion,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: () => {
            dispatch(getRuns());
        },
        deleteRuns: (uid) => {
            dispatch(deleteRuns(uid));
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DataPackPage);
