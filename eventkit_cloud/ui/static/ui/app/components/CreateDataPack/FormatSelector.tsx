import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import {connect} from "react-redux";
import {updateExportOptions} from '../../actions/datacartActions';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import {Compatibility} from '../../utils/enums';
import {IncompatibilityInfo} from "./ExportInfo";
import {getDefaultFormat} from "../../utils/generic";
import InfoDialog from "../Dialog/InfoDialog";

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
    formatItem: {
        display: 'flex',
    },
    formatDialogIcon: {
        marginLeft: '5px',
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
    errorMessage: {
        color: 'red',
        minHeight: '17px',
        fontSize: '12px',
    },
    infoItem: {
        display: 'flex',
        [theme.breakpoints.down('sm')]: {
            display: 'block',
        },
        '& strong': {
            marginRight: '5px',
            whiteSpace: 'nowrap',
            [theme.breakpoints.down('sm')]: {
                whiteSpace: 'unset',
            },
        }
    }
});

interface Props {
    formats: Eventkit.Format[];
    provider: Eventkit.Provider;
    providerOptions: Eventkit.Store.ProviderExportOptions;
    updateExportOptions: (providerSlug: string, providerOptions: any) => void;
    getFormatCompatibility: (format: string) => Compatibility;
    incompatibilityInfo: IncompatibilityInfo;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
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

        if (!providerOptions.formats) {
            this.props.updateExportOptions(this.props.provider.slug,
                {
                    ...providerOptions,
                    formats: getDefaultFormat(this.props.provider)
                });
        }
    }

    handleChange(event) {
        const providerOptions = {...this.props.providerOptions};
        const selectedFormats = [...providerOptions.formats] || [];

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

    getCheckBox(format: Eventkit.Format) {
        const { formats, classes, providerOptions } = this.props;
        const selectedFormats = providerOptions.formats || [];

        const compatibility = this.props.getFormatCompatibility(format.slug);
        let checkedIcon;
        let errorMessage;
        if (compatibility === Compatibility.Full) {
            checkedIcon = (<CheckBoxIcon/>);
        } else {
            checkedIcon = (<IndeterminateCheckBoxIcon/>);
            if (compatibility === Compatibility.None) {
                errorMessage = 'Not available in selected projection(s)';
            }
        }
        return (
            <div className={classes.container}>
                <Checkbox
                    className="qa-FormatSelector-CheckBox-format"
                    classes={{root: classes.checkbox, checked: classes.checked}}
                    name={format.slug}
                    checked={selectedFormats.indexOf(format.slug) >= 0}
                    checkedIcon={checkedIcon}
                    onChange={this.handleChange}
                />
                <div
                    className={classes.listItem}
                    style={{marginBottom: '0px'}}
                >
                    <div className={classes.listItemText}>
                        <div className={classes.formatItem}>
                            <span>{format.name}</span>
                            <span className={classes.formatDialogIcon}>
                                <InfoDialog
                                    title={`Format Details  `}
                                >
                                    <div style={{ display: 'unset', fontSize: '14px' }}>
                                        <strong style={{fontSize: '1.5em', paddingBottom: '15px'}}>
                                            Format(s):
                                        </strong>
                                        {formats.map((format, ix) => (
                                                <div style={{ padding: '3px' }} key={ix}>
                                                    <div className={classes.infoItem}>
                                                        <strong>
                                                            {format.name}:
                                                        </strong>
                                                        <span>{format.description}</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </InfoDialog>
                            </span>
                        </div>
                    </div>
                    <div className={classes.errorMessage}>{errorMessage}</div>
                </div>
            </div>
        );
    }

    render() {
        const {formats} = this.props;
        if (formats) {
            return (
                <div className={`qa-FormatSelector-Container`} key={this.props.provider.slug}>
                    {formats.map((format) => (
                        <div
                            key={format.slug}
                            className={`qa-FormatSelector-ListItem`}
                        >
                            {this.getCheckBox(format)}
                        </div>
                    ))}
                </div>
            );
        } else {
            return null;
        }
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

export default withTheme(withStyles<any, any>(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(FormatSelector)));
