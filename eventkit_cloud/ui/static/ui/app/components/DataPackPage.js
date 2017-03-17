import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {getRuns, deleteRuns} from '../actions/DataPackListActions';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import DatePicker from 'material-ui/DatePicker';
import RaisedButton from 'material-ui/RaisedButton';
import DropDownMenu from 'material-ui/DropDownMenu';
import FlatButton from 'material-ui/FlatButton';
import MenuItem from 'material-ui/MenuItem';
import * as exportActions from '../actions/exportsActions';
import DataPackList from './DataPackList';
import primaryStyles from '../styles/constants.css'
import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';
import DataPackSearchbar from './DataPackSearchbar';
import { Link } from 'react-router';
import * as utils from '../utils/sortUtils';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';

export class DataPackPage extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.state = {
            runs: [],
            displayedRuns: [],
            dataPackButtonFontSize: '',
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
        this.screenSizeUpdate();
        this.props.getRuns();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        if(window.innerWidth <= 750) {
            this.setState({dataPackButtonFontSize: '10px'});
        }
        else if (window.innerWidth <= 900) {
            this.setState({dataPackButtonFontSize: '13px'});
        }
        else if (window.innerWidth <= 1000) {
            this.setState({dataPackButtonFontSize: '13px'});
        }
        else {
            this.setState({dataPackButtonFontSize: '14px'});
        }
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

    

    render() {

        const pageTitle = "DataPack Library"
        const styles = {
            wholeDiv: {
                marginTop:'-10px',
                width:'1000%',
                height: '1000%',
                backgroundImage: 'url(https://cdn.frontify.com/api/screen/thumbnail/aJdxI4Gb10WEO716VTHSrCi7_Loii0H5wGYb5MuB66RmTKhpWG-bQQJ2J68eAjT5ln4d2enQJkV4sVaOWCG2nw)',
                backgroundRepeat: 'repeat repeat',
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
            toolbarTitleCommon: {
                color: '#4598bf',
            },
            createDataPackStyle: {
                margin: '0px', 
                minWidth: '50px', 
                height: '35px', 
                borderRadius: '0px'
            },
            createDataPackLabel: {
                fontSize: this.state.dataPackButtonFontSize,
                paddingLeft: '30px', 
                paddingRight: '30px', 
                lineHeight: '35px'
            },
            dropDown: {
                height: '30px',
                lineHeight: '35px',
                float: 'left',
            },
            dropDownSort: {
                height: '30px',
                lineHeight: '35px',
                float: 'right',
            },
            dropDownItem: {
                fontSize: '12px',
            },
            dropDownIcon: {
                height: '30px', 
                width: '30px', 
                padding: '0px', 
                marginRight: '5px', 
                fill: '#4498c0'
            },
            sortIcon: {
                height: '30px',
                width: '30px',
                padding: '0px',
                fill: '#4498c0'
            },
            showFilterDrawerBtn: {
                float: 'right',
                height: '30px',
                fontSize: '15px',
                lineHeight: '30px'
            }
        };

        return (
        <div>
            <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                    iconElementLeft={<p></p>}>
                <Link to={'/create'}>
                    <RaisedButton 
                        label={"Create DataPack"}
                        primary={true}
                        labelStyle={styles.createDataPackLabel}
                        style={styles.createDataPackStyle}
                        buttonStyle={{borderRadius: '0px'}}
                        overlayStyle={{borderRadius: '0px'}}
                    />
                </Link>
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
                    <DropDownMenu 
                        style={styles.dropDown}
                        labelStyle={{lineHeight: '30px', color: '#4498c0', paddingLeft: '5px'}} 
                        iconStyle={styles.dropDownIcon}
                        listStyle={{paddingTop: '5px', paddingBottom: '0px'}}
                        selectedMenuItemStyle={{color: '#4498c0'}} 
                        underlineStyle={{borderTopColor: '#4498c0', marginLeft: '0px'}}            
                        value={this.state.dropDownValue}
                        onChange={this.handleDropDownChange}>
                        <MenuItem style={styles.dropDownItem} value={1} primaryText={"All DataPacks"} />
                        <MenuItem style={styles.dropDownItem} value={2} primaryText={"My DataPacks"} />
                    </DropDownMenu>
                    <FlatButton 
                        style={styles.showFilterDrawerBtn}
                        label={"Filter"}
                        labelPosition={"before"}
                        labelStyle={{color: '#4498c0', textTransform: 'none'}}
                        icon={<NavigationArrowDropDown style={{fill: '#4498c0'}}/>}
                        hoverColor={'#253447'}
                        disableTouchRipple={true}
                    >
                    </FlatButton>
                    <DropDownMenu
                        style={styles.dropDownSort}
                        labelStyle={{lineHeight: '30px', color: '#4498c0', paddingLeft: '0px', paddingRight: '46px'}} 
                        iconStyle={styles.sortIcon}
                        listStyle={{paddingTop: '5px', paddingBottom: '0px'}}
                        selectedMenuItemStyle={{color: '#4498c0'}}
                        underlineStyle={{display: 'none'}}
                        value={this.state.sortDropDown}
                        onChange={this.handleSortChange}
                        autoWidth={false}>
                        <MenuItem style={styles.dropDownItem} value={utils.orderNewest} primaryText={"Newest"}/>
                        <MenuItem style={styles.dropDownItem} value={utils.orderOldest} primaryText={"Oldest "}/>
                        <MenuItem style={styles.dropDownItem} value={utils.orderAZ} primaryText={"Name (A-Z)"}/>
                        <MenuItem style={styles.dropDownItem} value={utils.orderZA} primaryText={"Name (Z-A)"}/>
                    </DropDownMenu>
            </Toolbar>
            
            <div className={styles.wholeDiv}>
                <div>
                    <DataPackList 
                        runs={this.state.displayedRuns} 
                        user={this.props.user} 
                        onRunDelete={this.props.deleteRuns}/>
                </div>

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
