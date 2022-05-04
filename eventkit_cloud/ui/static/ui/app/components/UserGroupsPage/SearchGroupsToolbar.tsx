import * as React from 'react';
import {connect} from "react-redux";
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import withTheme from '@mui/styles/withTheme';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import '../../styles/typeaheadStyles.css';
import debounce from 'lodash/debounce';
import {Menu, Typeahead} from 'react-bootstrap-typeahead';
import {getGroups, types} from "../../actions/groupActions";
import TypeaheadMenuItem from "../MapTools/TypeaheadMenuItem";
import SearchAOIButton from "../MapTools/SearchAOIButton";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        position: 'sticky',
        width: 'calc(100% - 70px)',
        minWidth: '300px',
        height: '50px',
    },
    buttonContainer: {
        position: 'absolute',
        left: '0px',
        width: '50px',
        height: '50px',
        borderRight: '1px solid rgba(112, 114, 116, 1)',
    },
    error: {
        color: theme.eventkit.colors.warning,
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
    spinnerContainer: {
        zIndex: 3,
        position: 'absolute',
        right: '12px',
        bottom: '13px',
        width: '25px',
    },
    spinner: {
        float: 'right',
    },
});

interface Props {
    groups: {
        cancelSource: boolean;
        data: any;
        error: any;
        fetched: boolean;
        fetching: boolean;
        empty: boolean;
    };
    getGroups: (args: any, append: boolean) => void;
    setFetchingGroups: () => void;
    user: Eventkit.User['user'];
    pageSize: number;
    page: number;
    permission_level: string;
    setQuery: (value: string) => void;
    theme: any;
    classes: { [className: string]: string };
}

interface State {
    suggestions: any[];
    toolbarIcons: {
        box: string;
        free: string;
        search: string;
    };
}

export class SearchGroupsToolbar extends React.Component<Props, State> {
    private typeAheadInput: React.RefObject<Typeahead>;
    private debouncer;

    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.setAllButtonsDefault = this.setAllButtonsDefault.bind(this);
        this.setButtonSelected = this.setButtonSelected.bind(this);
        this.state = {
            suggestions: [],
            toolbarIcons: {
                box: 'DEFAULT',
                free: 'DEFAULT',
                search: 'DEFAULT',
            },
        };
        this.typeAheadInput = React.createRef();
    }

    componentDidMount() {
        this.debouncer = debounce(e => this.handleChange(e), 500);
    }

    componentDidUpdate(prevProps) {
        if (this.props.groups.fetched === true && !prevProps.groups.fetched) {
            this.setState({suggestions: this.props.groups.data});
        } else if (!this.props.groups.fetched && this.state.suggestions.length > 0) {
            this.setState({suggestions: []});
        }
    }

    handleInputChange(e) {
        this.setState({
            suggestions: []
        });
        this.props.setFetchingGroups();
        this.debouncer(e);
    }

    handleChange(e) {
        this.props.setQuery(e);
    }

    setAllButtonsDefault() {
        const icons = {...this.state.toolbarIcons};
        Object.keys(icons).forEach((key) => {
            icons[key] = 'DEFAULT';
        });
        this.setState({toolbarIcons: icons});
    }

    setButtonSelected(iconName) {
        const icons = {...this.state.toolbarIcons};
        Object.keys(icons).forEach((key) => {
            if (key === iconName) {
                icons[key] = 'SELECTED';
            } else {
                icons[key] = 'INACTIVE';
            }
        });
        this.setState({toolbarIcons: icons});
    }

    render() {
        const {classes} = this.props;

        const renderer = (results, menuProps) => {
            let content = null;
            if (this.props.groups.error) {
                content = (
                    <div className={classes.error}>
                        ERROR: {this.props.groups.error}
                    </div>
                );
            } else if (this.props.groups.fetched) {
                if (this.state.toolbarIcons.search === 'SELECTED' || results.length) {
                    content = results.map((result, index) => (
                        <TypeaheadMenuItem
                            result={result}
                            index={index}
                            key={JSON.stringify(result.properties)}
                        />
                    ))
                } else {
                    content = (
                        <div className={classes.empty}>
                            No results were found.
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
            <div className={classes.container}>
                <div className="typeahead">
                    <Typeahead
                        style={{fontSize: '12px'}}
                        id="groupsSearchBar"
                        ref={this.typeAheadInput}
                        disabled={this.state.toolbarIcons.search === 'INACTIVE'}
                        options={this.state.suggestions}
                        placeholder="SEARCH GROUPS"
                        onInputChange={this.handleInputChange}
                        labelKey="name"
                        filterBy={() => (
                            // this disables the built in filtering
                            // we dont need it since we are getting results dynamically
                            true
                        )}
                        paginate={false}
                        emptyLabel=" "
                        minLength={0}
                        renderMenu={renderer}
                        className="qa-SearchGroupsToolbar-typeahead"
                    />
                </div>
                <div className={classes.buttonContainer}>
                    <SearchAOIButton
                        buttonState={this.state.toolbarIcons.search}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                    />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        groups: state.groups
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setFetchingGroups: () => {
            dispatch({type: types.FETCHING_GROUPS});
        },
        getGroups: params => (
            dispatch(getGroups(params))
        ),
    };
}

export default withTheme((withStyles<any, any>(jss)(connect(mapStateToProps, mapDispatchToProps)(SearchGroupsToolbar))));