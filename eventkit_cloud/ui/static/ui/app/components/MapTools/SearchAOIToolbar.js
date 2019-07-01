import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import debounce from 'lodash/debounce';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Typeahead, Menu } from 'react-bootstrap-typeahead';
import TypeaheadMenuItem from './TypeaheadMenuItem';
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

    componentDidUpdate(prevProps) {
        if (this.props.geocode.fetched === true && !prevProps.geocode.fetched) {
            this.setState({ suggestions: this.props.geocode.data });
        } else if (!this.props.geocode.fetched && this.state.suggestions.length > 0) {
            this.setState({ suggestions: [] });
        }
        if (this.props.toolbarIcons.search !== prevProps.toolbarIcons.search) {
            if (this.props.toolbarIcons.search === 'DEFAULT') {
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
        const { colors } = this.props.theme.eventkit;

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
                backgroundColor: colors.white,
                ...this.props.containerStyle,
            },
            buttonContainer: {
                position: 'absolute',
                right: '0px',
                width: '50px',
                height: '50px',
            },
            error: {
                color: colors.warning,
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
                width: '50px',
                height: '100%',
                right: '0px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
                            key={JSON.stringify(result.properties)}
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
                    {this.props.geocode.fetching ?
                        <div style={styles.loading}>
                            <CircularProgress
                                size={25}
                                color="primary"
                            />
                        </div>
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(SearchAOIToolbar);
