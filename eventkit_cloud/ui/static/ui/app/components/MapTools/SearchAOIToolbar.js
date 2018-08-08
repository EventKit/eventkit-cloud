import PropTypes from 'prop-types';
import React, { Component } from 'react';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import debounce from 'lodash/debounce';
import CircularProgress from 'material-ui/CircularProgress';
import { Typeahead, Menu } from 'react-bootstrap-typeahead';
import { TypeaheadMenuItem } from './TypeaheadMenuItem';
import SearchAOIButton from './SearchAOIButton';
import css from '../../styles/typeahead.css';

export class SearchAOIToolbar extends Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleEnter = this.handleEnter.bind(this);
        this.state = {
            suggestions: [],
        };
    }

    componentWillMount() {
        this.debouncer = debounce(e => this.handleChange(e), 500);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.geocode.fetched === true) {
            this.setState({ suggestions: nextProps.geocode.data });
        } else if (this.state.suggestions.length > 0) {
            this.setState({ suggestions: [] });
        }
        if (nextProps.toolbarIcons.search !== this.props.toolbarIcons.search) {
            if (nextProps.toolbarIcons.search === 'DEFAULT') {
                this.typeaheadref.getInstance().clear();
            }
        }
    }

    handleInputChange(e) {
        this.setState({
            suggestions: [],
        });

        this.debouncer(e);
    }

    handleChange(e) {
        const query = e.slice(0, 1000);

        // If 2 or more characters are entered then make request for suggested names.
        if (query.length >= 2) {
            this.props.getGeocode(query);
        }
    }

    handleEnter(e) {
        const results = e.slice(0, 1000);

        this.setState({ suggestions: [] });
        if (results.length > 0) {
            if (this.props.handleSearch(results[0])) {
                this.props.setSearchAOIButtonSelected();
            } else {
                this.props.setAllButtonsDefault();
            }
            this.typeaheadref.getInstance().blur();
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
                ...this.props.containerStyle,
            },
            buttonContainer: {
                position: 'absolute',
                right: '0px',
                width: '50px',
                height: '50px',
            },
            error: {
                color: '#CE4427',
                padding: '16px',
                userSelect: 'none',
                cursor: 'default',
                borderTop: '1px solid rgba(112, 114, 116, .4)',
                borderBottom: '1px solid rgba(112, 114, 116, .4)',
            },
            empty: {
                padding: '16px',
                userSelect: 'none',
                cursor: 'default',
                borderTop: '1px solid rgba(112, 114, 116, .4)',
                borderBottom: '1px solid rgba(112, 114, 116, .4)',
            },
            loading: {
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: '1',
            },
        };

        const renderer = (results, menuProps) => {
            let content = null;
            if (this.props.geocode.error) {
                content = (
                    <div style={styles.error}>
                        ERROR: {this.props.geocode.error}
                    </div>
                );
            } else if (this.props.geocode.fetched) {
                if (results.length) {
                    content = results.map((result, index) => (
                        <TypeaheadMenuItem
                            result={result}
                            index={index}
                            key={`${result.name}${result.province}${result.region}${result.country}`}
                        />
                    ));
                } else {
                    content = (
                        <div style={styles.empty}>
                            No results
                        </div>
                    );
                }
            }

            return (
                <Menu {...menuProps}>
                    {content}
                </Menu>
            );
        };

        return (
            <div style={styles.container}>
                <div className={css.typeahead}>
                    <Typeahead
                        ref={(instance) => { this.typeaheadref = instance; }}
                        disabled={this.props.toolbarIcons.search === 'INACTIVE'}
                        options={this.state.suggestions}
                        onChange={this.handleEnter}
                        placeholder="Search admin boundary or location..."
                        onInputChange={this.handleInputChange}
                        labelKey="name"
                        filterBy={() => (
                            // this disables the built in filtering
                            // we dont need it since we are getting results dynamically
                            true
                        )}
                        paginate={false}
                        emptyLabel=""
                        minLength={2}
                        renderMenu={renderer}
                        className="qa-SearchAOIToolbar-typeahead"
                    />
                    {(this.props.geocode.fetching) ?
                        <CircularProgress
                            size={25}
                            style={styles.loading}
                            color="#4598bf"
                        />
                        : null
                    }
                </div>
                <div style={styles.buttonContainer}>
                    <SearchAOIButton
                        buttonState={this.props.toolbarIcons.search}
                        handleCancel={this.props.handleCancel}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                </div>
            </div>
        );
    }
}

SearchAOIToolbar.defaultProps = {
    containerStyle: {},
};

SearchAOIToolbar.propTypes = {
    toolbarIcons: PropTypes.object.isRequired,
    geocode: PropTypes.object.isRequired,
    getGeocode: PropTypes.func.isRequired,
    handleSearch: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setSearchAOIButtonSelected: PropTypes.func.isRequired,
    containerStyle: PropTypes.object,
};

export default SearchAOIToolbar;
