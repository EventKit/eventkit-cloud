import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './SearchAOIToolbar.css';
import {Typeahead} from 'react-bootstrap-typeahead'; // ES2015
import ExportsApi from '../api/exportsApi.js';
import {getGeonames, drawSearchBbox} from '../actions/searchToolbarActions';
import {clickDrawCancel} from '../actions/drawToolBarActions.js'

const debounce = require('lodash/debounce');

export class SearchAOIToolbar extends Component {

    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this);
        this.handleEnter = this.handleEnter.bind(this);
        this.handleFocus = this.handleFocus.bind(this);

        this.state = {
            value: '',
            suggestions: [],
        }
    }

    componentWillMount() {
      this.debouncer = debounce(e => {
        this.handleChange(e);
      }, 500);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.geonames.fetched == true) {
            this.state.suggestions = nextProps.geonames.geonames;
        }
        else {
            if(this.state.suggestions.length > 0) {
                this.setState({suggestions: []});
            }
        }
    }

    handleFocus() {
        this.refs.typeahead.getInstance().clear();
    }

    handleChange(e) {
        // If 2 or more characters are entered then make request for suggested names.
        if(e.length >= 2) {
            this.props.getGeonames(e);
        }
        // If one or zero characters are entered then dont provide suggestions
        else {
            // If there are suggestions remove them
            if(this.state.suggestions.length > 0) {
                this.setState({suggestions: []});
            }
        }
    }

    handleEnter(e) {
        this.setState({suggestions: []});
        if (e.length > 0) {
            let bbox = e[0].bbox;
            let formatted_bbox = [bbox.west, bbox.south, bbox.east, bbox.north]
            this.props.drawSearchBbox(formatted_bbox);
            this.refs.typeahead.getInstance().blur();
        }
    }

    render() {

        return (
            <div className={styles.searchbarDiv}>
                <i className={'fa fa-search'}/>
                <div className={styles.typeahead}>
                    <Typeahead
                        ref="typeahead"
                        options={this.state.suggestions}
                        onFocus={this.handleFocus}
                        onChange={this.handleEnter}
                        placeholder={'Search admin boundary or location...'}
                        onInputChange={this.debouncer}
                        labelKey={'name'}
                        ref="typeahead"
                        renderMenuItemChildren={(props, option, idx) => {
                            let returnStr = option.name;
                            if (option.adminName1){
                                returnStr = returnStr + ', ' + option.adminName1;
                            }
                            if (option.adminName2) {
                                returnStr = returnStr + ', ' + option.adminName2;
                            }
                            if (option.countryName) {
                                returnStr = returnStr + ', ' + option.countryName;
                            }
                            return returnStr
                        }}
                    />
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        geonames: state.geonames,
        searchBbox: state.searchBbox,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getGeonames: (query) => {
            dispatch(getGeonames(query));
        },
        drawSearchBbox: (bbox) => {
            dispatch(drawSearchBbox(bbox));
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchAOIToolbar);

