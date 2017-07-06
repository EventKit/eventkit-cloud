import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {getRuns, deleteRuns} from '../../actions/DataPackListActions';
import AppBar from 'material-ui/AppBar';
import CircularProgress from 'material-ui/CircularProgress';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import Drawer from 'material-ui/Drawer';
import DataPackGrid from './DataPackGrid';
import DataPackList from './DataPackList';
import primaryStyles from '../../styles/constants.css'
import DataPackSearchbar from './DataPackSearchbar';
import DataPackViewButtons from './DataPackViewButtons';
import DataPackSortDropDown from './DataPackSortDropDown';
import DataPackFilterButton from './DataPackFilterButton';
import DataPackOwnerSort from './DataPackOwnerSort';
import DataPackLinkButton from './DataPackLinkButton';
import FilterDrawer from './FilterDrawer';
import CustomScrollbar from '../CustomScrollbar';
import KeyboardArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import KeyboardArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';

export class DataPackPage extends React.Component {

    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleOwnerFilter = this.handleOwnerFilter.bind(this);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.toggleView = this.toggleView.bind(this);
        this.makeRunRequest = this.makeRunRequest.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.loadLess = this.loadLess.bind(this);
        this.state = {
            open: window.innerWidth < 1200 ? false: true,
            search: '',
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                submitted: false,
                incomplete: false,
            },
            grid: true,
            pageLoading: true,
            order: '-started_at',
            ownerFilter: '',
            pageSize: 12,
            loading: false,
        }
    }

    componentWillReceiveProps(nextProps) { 
        if(nextProps.runsList.fetched != this.props.runsList.fetched) { 
            if (nextProps.runsList.fetched == true) {
                if (this.state.pageLoading) {
                    this.setState({pageLoading: false});
                }
                if (this.state.loading) {
                    this.setState({loading: false});
                }
            }
        }
        if (nextProps.runsDeletion.deleted != this.props.runsDeletion.deleted) {
            if(nextProps.runsDeletion.deleted) {
                this.setState({loading: true}, this.makeRunRequest);
            }
        }
    }

    componentWillMount() {
        this.makeRunRequest();
        window.addEventListener('resize', this.screenSizeUpdate);
        this.fetch = setInterval(this.makeRunRequest, 10000);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
        clearInterval(this.fetch);
    }

    onSearch(searchText, ix) { 
        this.setState({search: searchText, loading: true}, this.makeRunRequest);
    }

    checkForEmptySearch(searchText, dataSource, params) {
        if(searchText == '') {
            this.setState({search: '', loading: true}, this.makeRunRequest);
        }
    }

    handleSortChange = (value) => {
        this.setState({order: value, loading: true}, this.makeRunRequest);
    }

    makeRunRequest() {
        let status = []
        Object.keys(this.state.status).forEach((key, ix) => {
            if(this.state.status[key]) {status.push(key.toUpperCase())};
        });

        const minDate = this.state.minDate ? `&min_date=${this.state.minDate.toISOString().substring(0, 10)}` : '';
        let maxDate = ''
        if(this.state.maxDate) {
            maxDate = new Date(this.state.maxDate.getTime());
            maxDate.setDate(maxDate.getDate() + 1);
            maxDate = `&max_date=${maxDate.toISOString().substring(0, 10)}`;
        }

        let params = '';
        params += `page_size=${this.state.pageSize}`;
        params += this.state.order ? `&ordering=${this.state.order}`: '';
        params += this.state.ownerFilter ? `&user=${this.state.ownerFilter}`: '';
        params += this.state.published ? `&published=${this.state.published}` : '';
        params += status.length ? `&status=${status.join(',')}` : '';
        params += minDate;
        params += maxDate;
        params += this.state.search ? `&search_term=${this.state.search}` : '';
        return this.props.getRuns(params);
    }

    handleOwnerFilter = (event, index, value) => {
        this.setState({ownerFilter: value, loading: true}, this.makeRunRequest);
    }

    handleFilterApply = (state) => {
        this.setState({...this.state, ...state, loading: true}, this.makeRunRequest);
        if(window.innerWidth < 1200) {
            this.setState({open: false});
        }
    }

    handleFilterClear = () => {
        this.setState({
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            loading: true
        }, this.makeRunRequest);
        if(window.innerWidth < 1200) {
            this.setState({open: false});
        }
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    toggleView() {
        if (['started_at', '-started_at', 'job__name', '-job__name'].indexOf(this.state.order) < 0) {
            this.setState({order: '-started_at', loading: true}, () => {
                let promise = this.makeRunRequest();
                promise.then(() => this.setState({grid: !this.state.grid}));
            });
        }
        else {
            this.setState({grid: !this.state.grid,});
        }
    }

    handleToggle = () => {
        this.setState({open: !this.state.open});
    }

    loadMore() {
        if (this.props.runsList.nextPage) {
            this.setState(
                {pageSize: this.state.pageSize + 12, loading: true}, 
                this.makeRunRequest
            );
        }
    }

    loadLess() {
        if (this.state.pageSize > 12) {
            this.setState(
                {pageSize: this.state.pageSize - 12, loading: true},
                this.makeRunRequest
            );
        }
    }

    render() { 
        const pageTitle = "DataPack Library"
        const range = this.props.runsList.range ? this.props.runsList.range.split('/') : null;
        const styles = {
            wholeDiv: {
                height: window.innerHeight - 236,
                backgroundRepeat: 'repeat repeat',
                marginRight: this.state.open && window.innerWidth >= 1200 ? '200px' : '0px',
                marginTop: '10px',
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
                overflowY: 'hidden',
                overflowX: 'hidden'
            },
            backgroundStyle: {
                backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')'
            },
            loadMore: {
                color: this.props.runsList.nextPage ? '#4598bf': 'grey', 
                cursor: this.props.runsList.nextPage ? 'pointer' : 'initial'
            },
            loadLess: {
                color: this.props.runsList.runs.length > 12 ? '#4598bf': 'grey',
                cursor: this.props.runsList.runs.length > 12 ? 'pointer': 'initial'
            },
            range: window.innerWidth < 768 ?
                {color: '#a59c9c', lineHeight: '36px', fontSize: '12px'}
                :
                {display: 'inline-block', position: 'absolute', color: '#a59c9c', lineHeight: '36px', right: '10px', fontSize: '12px'}
        };

        return (
            <div style={styles.backgroundStyle}>
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
                        <DataPackOwnerSort handleChange={this.handleOwnerFilter} value={this.state.ownerFilter} owner={this.props.user.data.user.username} />
                        <DataPackFilterButton handleToggle={this.handleToggle} />
                        {(!this.state.grid) && window.innerWidth >= 768 ? 
                            null
                            : 
                            <DataPackSortDropDown handleChange={(e, i, v) => {this.handleSortChange(v)}} value={this.state.order} />
                        }
                        <DataPackViewButtons handleGridSelect={this.toggleView} handleListSelect={this.toggleView} />
                </Toolbar>
                
                <div style={styles.wholeDiv}>
                    <FilterDrawer 
                        onFilterApply={this.handleFilterApply} 
                        onFilterClear={this.handleFilterClear}
                        open={this.state.open}/>

                    {this.state.pageLoading ? 
                        <div style={{width: '100%', height: '100%', display: 'inline-flex'}}>
                            <CircularProgress 
                                style={{margin: 'auto', display: 'block'}} 
                                color={'#4598bf'}
                                size={50}
                            />
                        </div>
                        :
                        <div style={{position: 'relative'}}>
                            {this.state.loading || this.props.runsDeletion.deleting ? 
                            <div style={{zIndex: 10, position: 'absolute', width: '100%', height: '100%',  backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                <div style={{width: '100%', height: '100%', display: 'inline-flex'}}>
                                    <CircularProgress 
                                        style={{margin: 'auto', display: 'block'}} 
                                        color={'#4598bf'}
                                        size={50}
                                    />
                                </div>
                            </div>
                            : null}
                        <CustomScrollbar style={{height: styles.wholeDiv.height, width: '100%'}}>
                            
                            {this.state.grid ?
                                <DataPackGrid 
                                    runs={this.props.runsList.runs} 
                                    user={this.props.user} 
                                    onRunDelete={this.props.deleteRuns}
                                />
                            :
                                <DataPackList
                                    runs={this.props.runsList.runs}
                                    user={this.props.user}
                                    onRunDelete={this.props.deleteRuns}
                                    onSort={this.handleSortChange}
                                    order={this.state.order}
                                />
                            }
                            <div style={{textAlign: 'center', paddingBottom: '10px', margin: '0px 10px', position: 'relative', height: '46px'}}>
                                <div style={{display: 'inline-block'}}>
                                    <RaisedButton 
                                        backgroundColor={'#e5e5e5'}
                                        labelColor={'#4498c0'}
                                        label={'Show Less'}
                                        disabled={this.props.runsList.runs.length <= 12}
                                        onClick={this.loadLess}
                                        icon={<KeyboardArrowUp/>}
                                        style={{minWidth: '145px', marginRight: '2.5px'}}
                                    />
                                    
                                    <RaisedButton 
                                        backgroundColor={'#e5e5e5'}
                                        labelColor={'#4498c0'}
                                        label={'Show More'}
                                        disabled={!this.props.runsList.nextPage}
                                        onClick={this.loadMore}
                                        icon={<KeyboardArrowDown/>}
                                        style={{minWidth: '145px', marginLeft: '2.5px'}}
                                    />
                                </div>
                                <div id='range' style={styles.range}>
                                    {range ? `${range[0]} of ${range[1]}` : ''}
                                </div>
                            </div>
                        </CustomScrollbar>
                        </div>
                    }
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
        getRuns: (params) => {
            return dispatch(getRuns(params));
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
