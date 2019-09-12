import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import {connect} from "react-redux";
import {updateExportOptions} from '../../actions/datacartActions';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        display: 'flex',
        width: '100%',
    },
    listItem: {
        fontWeight: 'normal',
        paddingLeft: '10px',
        marginBottom: '10px',
        whiteSpace: 'pre-wrap',
    },
    listItemText: {
        fontSize: 'inherit',
    },
    sublistItem: {
        fontWeight: 'normal',
        fontSize: '.9em',
        paddingTop: '3px',
        borderTop: theme.eventkit.colors.secondary,
    },
    checkbox: {
        width: '24px',
        height: '24px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
    },
    checked: {},
    name: {
        marginRight: '10px',
        display: 'flex',
        flex: '1 1 auto',
        flexWrap: 'wrap',
    },
    expand: {
        display: 'flex',
        flex: '0 0 auto',
    },
    license: {
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
    },
});

interface Props {
    formats: Eventkit.Format[];
    provider: Eventkit.Provider;
    providerOptions: Eventkit.Store.ProviderExportOptions;
    updateExportOptions: (providerSlug: string, providerOptions: any) => void;
    theme: Eventkit.Theme & Theme;
    classes: {
        container: string;
        listItem: string;
        listItemText: string;
        sublistItem: string;
        checkbox: string;
        checked: string;
        name: string;
        expand: string;
        license: string;
        prewrap: string;
    };
}

export class FormatSelector extends React.Component<Props, {}> {

    static defaultProps;

    constructor(props: Props) {
        super(props);
        this.state = {};
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        // If this is the first time hitting this page, the datacart will be in a default state
        // with no formats selected. We want GPKG to be selected by default.
        const providerOptions = {...this.props.providerOptions};
        let formats;
        if (!providerOptions.formats) {
            if (this.props.formats.map(format => format.slug).indexOf('gpkg') >= 0) {
                formats = ['gpkg'];
            }
            this.props.updateExportOptions(this.props.provider.slug,
                {...providerOptions, formats});
        }
    }

    handleChange(event) {
        const providerOptions = {...this.props.providerOptions};
        const selectedFormats = providerOptions.formats || [];

        let index;
        // check if the check box is checked or unchecked
        // `target` is the checkbox, and the `name` field is set to the format slug
        const selectedFormatSlug = event.target.name;
        if (event.target.checked) {
            // add the format to the array
            if (selectedFormats.indexOf(selectedFormatSlug) <= 0) {
                selectedFormats.push(selectedFormatSlug);
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = selectedFormats.indexOf(selectedFormatSlug);
            if (index >= 0) {
                selectedFormats.splice(index, 1);
            }
        }
        this.props.updateExportOptions(this.props.provider.slug,
            {...providerOptions, formats: selectedFormats});
    }

    render() {
        const {colors} = this.props.theme.eventkit;
        const {formats, classes} = this.props;
        const {providerOptions} = this.props;
        const selectedFormats = providerOptions.formats || [];

        return (
                <div className={`qa-FormatSelector-Container`} key={this.props.provider.slug}>
                {formats.map((format) => (
                    <div
                        key={format.slug}
                        className={`qa-FormatSelector-ListItem`}
                    >
                        <div className={classes.container}>
                            <Checkbox
                                className="qa-FormatSelector-CheckBox-format"
                                classes={{root: classes.checkbox, checked: classes.checked}}
                                name={format.slug}
                                checked={selectedFormats.indexOf(format.slug) >= 0}
                                onChange={this.handleChange}
                            />
                            <div
                                className={classes.listItem}
                            >
                                <div className={classes.listItemText}>{format.name}</div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        providerOptions: state.exportInfo.exportOptions[ownProps.provider.slug] || {} as Eventkit.Store.ProviderExportOptions,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportOptions: (providerSlug, providerOptions) => {
            dispatch(updateExportOptions({providerSlug, providerOptions}));
        },
    };
}

export default withTheme()(withStyles<any, any>(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(FormatSelector)));
