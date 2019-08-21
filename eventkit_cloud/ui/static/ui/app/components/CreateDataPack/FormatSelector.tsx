import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import {connect} from "react-redux";
import {updateExportOptions} from '../../actions/datacartActions';
import List from '@material-ui/core/List';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        display: 'flex',
        width: '100%',
    },
    listItem: {
        fontWeight: 'normal',
        fontSize: '16px',
        padding: '16px 10px',
    },
    listItemText: {
        fontSize: 'inherit',
    },
    sublistItem: {
        fontWeight: 'normal',
        fontSize: '13px',
        padding: '14px 20px 14px 49px',
        borderTop: theme.eventkit.colors.secondary,
    },
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '15px',
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
    prewrap: {
        whiteSpace: 'pre-wrap',
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

interface State {

}

export class FormatSelector extends React.Component<Props, State> {

    static defaultProps;

    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    handleChange = (event) => {
        let providerOptions = {...this.props.providerOptions};
        let selectedFormats = providerOptions.formats || [];

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
    };

    render() {
        const {colors} = this.props.theme.eventkit;
        const {formats, classes} = this.props;
        const {providerOptions} = this.props;
        const selectedFormats = providerOptions.formats || [];

        return (
            <List
                id="ProviderList"
                className="qa-ExportInfo-List"
                style={{width: '100%', fontSize: '16px'}}
            >
                {formats.map((format, ix) => (
                    <ListItem
                        className={`qa-FormatSelector-ListItem ${classes.listItem}`}
                        style={{backgroundColor: (ix % 2 === 0) ? colors.secondary : colors.white}}
                        dense
                        key={format.slug}
                        disableGutters
                    >
                        <div className={classes.container}>
                            <Checkbox
                                className="qa-FormatSelector-CheckBox-format"
                                classes={{root: classes.checkbox, checked: classes.checked}}
                                name={format.slug}
                                checked={selectedFormats.indexOf(format.slug) >= 0}
                                onChange={this.handleChange}
                            />
                            <ListItemText
                                disableTypography
                                classes={{root: classes.listItemText}}
                                primary={<div className={classes.prewrap}>{format.name}</div>}
                            />
                        </div>
                    </ListItem>
                ))}
            </List>
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        providerOptions: state.exportInfo.exportOptions[ownProps.provider] || {} as Eventkit.Store.ProviderExportOptions,
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