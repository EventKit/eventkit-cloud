import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {getRuns} from '../actions/DataPackListActions';
import AppBar from 'material-ui/AppBar'
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import DatePicker from 'material-ui/DatePicker';
import RaisedButton from 'material-ui/RaisedButton';
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import * as exportActions from '../actions/exportsActions';
import DataPackList from './DataPackList';
import primaryStyles from '../styles/constants.css'
import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';
import DataPackSearchbar from './DataPackSearchbar';
import { Link } from 'react-router';

class Exports extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.state = {
            runs: [],
            filteredRuns: [],
            dataPackButtonFontSize: '',
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.runsList.fetched == true) {
            let runsUnsorted = nextProps.runsList.runs;
            let runsSorted = sortBy(runsUnsorted, [function(o) {return o.user;}]);
            this.setState({runs: runsUnsorted});
            this.setState({filteredRuns: runsSorted});
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

    handleSearch(searchText, ix) {
        const query = searchText.toUpperCase();
        let searched = filter(this.state.runs, function(o) {
            if(o.job.name.toUpperCase().includes(query)) { return true}
            if(o.job.description.toUpperCase().includes(query)) {return true}
            if(o.job.event.toUpperCase().includes(query)) {return true}
        });
        this.setState({filteredRuns: searched});
    }

    checkForEmptySearch(searchText, dataSource, params) {
        if(searchText == '') {
            this.setState({filteredRuns: this.state.runs});
        }
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
            toolbarCommon: {
                backgroundColor: '#253447',
            },
            toolbarTitleCommon: {
                color: '#4598bf',
            },
            separator: {
                marginLeft: '12px', 
                marginRight: '12px', 
                backgroundColor: '#161e2e',
                opacity: '0.7',
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
            <Toolbar style={styles.toolbarCommon}>
                <ToolbarGroup style={{margin: 'auto', width: '100%'}}>
                    <DataPackSearchbar
                        onSearchChange={this.checkForEmptySearch}
                        onSearchSubmit={this.handleSearch}
                        searchbarWidth={'100%'} 
                    />
                </ToolbarGroup>
            </Toolbar>
            
            <div className={styles.wholeDiv}>
                <div>
                    <DataPackList runs={this.state.filteredRuns} user={this.props.user} />
                </div>

                <div >
                    {this.props.children}
                </div>
            </div>

        </div>
              
            
        );
    }
}


Exports.propTypes = {
    runsList: PropTypes.object,
};

function mapStateToProps(state) {
    return {
        runsList: state.runsList,
        user: state.user,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: () => {
            dispatch(getRuns());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Exports);
