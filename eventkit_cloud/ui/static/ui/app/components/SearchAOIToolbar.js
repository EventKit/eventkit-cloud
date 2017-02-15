import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../styles/SearchAOIToolbar.css';
import {Typeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import ExportsApi from '../api/exportsApi.js';
import {getGeonames} from '../actions/searchToolbarActions';
import {setAllButtonsDefault} from '../actions/mapToolActions';
import {TypeaheadMenuItem} from './TypeaheadMenuItem';

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
        this.props.handleCancel();
        this.props.setAllButtonsDefault();
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
            this.props.handleSearch(e[0]);
            this.refs.typeahead.getInstance().blur();
        }
    }

    render() {

        return (
            <div className={styles.searchbarDiv}>
                {/*<i className={'fa fa-search'}/>*/}
                <div className={styles.typeahead}>
                    <Typeahead
                        ref="typeahead"
                        options={this.state.suggestions}
                        onFocus={this.handleFocus}
                        onChange={this.handleEnter}
                        placeholder={'Search admin boundary or location...'}
                        onInputChange={this.debouncer}
                        labelKey={'name'}
                        paginate={false}
                        emptyLabel={''}
                        minLength={2}
                        renderMenu={(results, menuProps) => {
                            return(
                                <Menu {...menuProps}>
                                    {results.map((result, index) => (
                                        <TypeaheadMenuItem result={result} index={index}/>
                                    ))
                                    }
                                </Menu>        
                            )
                        }}
                    />
                </div>
            </div>
        )
    }
}

SearchAOIToolbar.propTypes = {
    geonames: React.PropTypes.object,
    getGeonames: React.PropTypes.func,
    handleSearch: React.PropTypes.func,
    handleCancel: React.PropTypes.func,
    setAllButtonsDefault: React.PropTypes.func,
}

function mapStateToProps(state) {
    return {
        geonames: state.geonames,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getGeonames: (query) => {
            dispatch(getGeonames(query));
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchAOIToolbar);

