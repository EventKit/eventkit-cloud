import React, {Component, PropTypes} from 'react';
import css from '../../styles/SearchAOIToolbar.css';
import {Typeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import {TypeaheadMenuItem} from './TypeaheadMenuItem';
import SearchAOIButton from './SearchAOIButton';
import {getGeocode} from '../../actions/searchToolbarActions';
import debounce from 'lodash/debounce';

export class SearchAOIToolbar extends Component {

    constructor(props) {
        super(props)
        this.handleChange = this.handleChange.bind(this);
        this.handleEnter = this.handleEnter.bind(this);
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
        if(nextProps.geocode.fetched == true) {
            this.setState({suggestions: nextProps.geocode.data});
        }
        else {
            if(this.state.suggestions.length > 0) {
                this.setState({suggestions: []});
            }
        }
        if(nextProps.toolbarIcons.search != this.props.toolbarIcons.search) {
            if(nextProps.toolbarIcons.search == 'DEFAULT') {
                this.refs.typeahead.getInstance().clear();
            }
        }
    }

    handleChange(e) {
        // If 2 or more characters are entered then make request for suggested names.
        if(e.length >= 2) {
            this.props.getGeocode(e);
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
            if(this.props.handleSearch(e[0])){
                this.props.setSearchAOIButtonSelected();
            }else{
                this.props.setAllButtonsDefault();
            }
            this.refs.typeahead.getInstance().blur();
        }
    }

    render() {
        const styles = {
            container: {
                zIndex: 2, 
                position: 'absolute', 
                width: 'calc(100% - 60px)', 
                minWidth: '300px', 
                maxWidth: '700px', 
                height: '50px', 
                top: '1em', 
                right: '10px', 
                backgroundColor: '#fff',
                ...this.props.containerStyle
            },
            buttonContainer: {
                position: 'absolute', 
                right: '0px', 
                width: '50px', 
                height: '50px'
            }
        }
        return (
            <div style={styles.container}>
                <div className={css.typeahead}>
                    <Typeahead
                        ref="typeahead"
                        disabled={this.props.toolbarIcons.search == 'INACTIVE'}
                        options={this.state.suggestions}
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
                                        <TypeaheadMenuItem result={result} index={index} key={index}/>
                                    ))
                                    }
                                </Menu>        
                            )
                        }}
                    />
                </div>
                <div style={styles.buttonContainer}>
                    <SearchAOIButton
                        buttonState={this.props.toolbarIcons.search}
                        handleCancel={this.props.handleCancel}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                </div>
            </div>
        )
    }
}

SearchAOIToolbar.propTypes = {
    toolbarIcons: PropTypes.object,
    geocode: PropTypes.object,
    getGeocode: PropTypes.func,
    handleSearch: PropTypes.func,
    handleCancel: PropTypes.func,
    setAllButtonsDefault: PropTypes.func,
    setSearchAOIButtonSelected: PropTypes.func,
    containerStyle: PropTypes.object
}

export default SearchAOIToolbar;
