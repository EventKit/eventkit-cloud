import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {getJobs} from '../actions/JobListActions';
import AppBar from 'material-ui/AppBar'
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import DatePicker from 'material-ui/DatePicker';
import RaisedButton from 'material-ui/RaisedButton';
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import * as exportActions from '../actions/exportsActions';
import JobList from './JobList';
import primaryStyles from '../styles/constants.css'
import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';
import DataPackSearchbar from './DataPackSearchbar';

class Exports extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.state = {
            jobs: [],
            filteredJobs: [],
            searchbarWidth: '',
            dataPackButtonFontSize: '',
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.jobsList.fetched == true) {
            let jobsUnsorted = nextProps.jobsList.jobs;
            let jobsSorted = sortBy(jobsUnsorted, [function(o) {return o.owner;}]);
            this.setState({jobs: jobsUnsorted});
            this.setState({filteredJobs: jobsSorted});
        }
    }

    componentWillMount() {
        this.screenSizeUpdate();
        this.props.getJobs();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        if(window.innerWidth <= 750) {
            this.setState({searchbarWidth: '200px'});
            this.setState({dataPackButtonFontSize: '10px'});
        }
        else if (window.innerWidth <= 900) {
            this.setState({searchbarWidth: '300px'});
            this.setState({dataPackButtonFontSize: '13px'});
        }
        else if (window.innerWidth <= 1000) {
            this.setState({searchbarWidth: '400px'});
            this.setState({dataPackButtonFontSize: '13px'});
        }
        else {
            this.setState({searchbarWidth: '500px'});
            this.setState({dataPackButtonFontSize: '14px'});
        }
    }

    handleSearch(searchText, ix) {
        const query = searchText.toUpperCase();
        let searched = filter(this.state.jobs, function(o) {
            if(o.name.toUpperCase().includes(query)) { return true}
            if(o.description.toUpperCase().includes(query)) {return true}
            if(o.event.toUpperCase().includes(query)) {return true}
        });
        this.setState({filteredJobs: searched});
    }

    checkForEmptySearch(searchText, dataSource, params) {
        if(searchText == '') {
            this.setState({filteredJobs: this.state.jobs});
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
                marginTop: '25px'
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
        };

        return (
        <div>
            <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                    iconElementLeft={<p></p>}
            />
            <Toolbar style={styles.toolbarCommon}>
                <ToolbarGroup style={{margin: 'auto'}}>
                    <DataPackSearchbar
                        onSearchChange={this.checkForEmptySearch}
                        onSearchSubmit={this.handleSearch}
                        searchbarWidth={this.state.searchbarWidth} 
                    />
                    <ToolbarSeparator style={styles.separator}/>
                    <RaisedButton 
                        label={"Create DataPack"}
                        primary={true}
                        href={'/create'}
                        labelStyle={{fontSize: this.state.dataPackButtonFontSize, paddingLeft: '10px', paddingRight: '10px'}}
                        style={{margin: '10px 0px', minWidth: '50px'}}
                    >
                    </RaisedButton>
                </ToolbarGroup>
            </Toolbar>
            
            <div className={styles.wholeDiv}>
                <div>
                    <JobList jobs={this.state.filteredJobs} />
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
    jobsList: PropTypes.object,
};

function mapStateToProps(state) {
    return {
        jobsList: state.jobsList,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getJobs: () => {
            dispatch(getJobs());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Exports);
