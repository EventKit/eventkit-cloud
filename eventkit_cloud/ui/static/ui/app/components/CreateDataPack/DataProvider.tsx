import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import CircularProgress from '@material-ui/core/CircularProgress';
import Checkbox from '@material-ui/core/Checkbox';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ProviderStatusIcon from './ProviderStatusIcon';
import BaseDialog from '../Dialog/BaseDialog';
import {getDuration, formatMegaBytes, isZoomLevelInRange, supportsZoomLevels} from '../../utils/generic';
import {Typography} from "@material-ui/core";
import ZoomLevelSlider from "./ZoomLevelSlider";
import {connect} from "react-redux";
import {updateExportInfo} from '../../actions/datacartActions';
import {MapView} from "../common/MapView";
import debounce from 'lodash/debounce';
import * as PropTypes from "prop-types";
import FormatSelector from "./FormatSelector";

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
        padding: '0px 20px 14px 49px',
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

interface EstimateData {
    value: number;
    units: string;
}

export interface ProviderData extends Eventkit.Provider {
    availability?: {
        slug: string;
        status: string;
        type: string;
        message: string;
    };
    estimate?: {
        size?: EstimateData;
        time?: EstimateData;
        slug: string;
    };
}

interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providerOptions: any;
    updateExportInfo: (args: any) => void;
    provider: ProviderData;
    checkProvider: (args: any) => void;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    alt: boolean;
    theme: Eventkit.Theme & Theme;
    renderEstimate: boolean;
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
    open: boolean;
    licenseDialogOpen: boolean;
    zoomLevel: number;
}

export class DataProvider extends React.Component<Props, State> {

    static defaultProps;
    private estimateDebouncer;

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.handleLicenseOpen = this.handleLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.handleExpand = this.handleExpand.bind(this);
        this.setZoom = this.setZoom.bind(this);
        this.estimateDebouncer = () => { /* do nothing while not mounted */
        };
        this.state = {
            open: false,
            licenseDialogOpen: false,
            zoomLevel: this.props.provider.level_to,
        };
    }

    componentDidMount() {
        this.estimateDebouncer = debounce((val) => {
            this.props.checkProvider(val);
        }, 1000);
    }

    private setZoom(minZoom: number, maxZoom: number) {
        // update the state with the new array of options
        const {provider} = this.props;
        let providerOptions = {...this.props.providerOptions};

        // Check if a value was already set, we will fall back to this if the new values are invalid
        // If no values have been set, or the values are somehow invalid,
        // we will instead fall back to the min/max for the provider (from/to)
        let lastMin = providerOptions.minZoom;
        let lastMax = providerOptions.maxZoom;
        if (!isZoomLevelInRange(lastMin, provider)) {
            lastMin = provider.level_from;
        }
        if (!isZoomLevelInRange(lastMax, provider)) {
            lastMax = provider.level_to;
        }


        // Check the parameters, if they are invalid, fall back to lastMin and or lastMax
        if (!isZoomLevelInRange(minZoom, provider)) {
            minZoom = lastMin;
        }
        if (!isZoomLevelInRange(maxZoom, provider)) {
            maxZoom = lastMax;
        }

        const updatedExportOptions = {
            ...this.props.exportInfo.exportOptions,
            [provider.slug]: {
                ...providerOptions,
                minZoom,
                maxZoom,
            }
        };
        this.props.updateExportInfo({
            exportOptions: updatedExportOptions,
        });

        if (minZoom !== lastMin || maxZoom !== lastMax) {
            // Only trigger an estimate update if the value is new.
            this.estimateDebouncer(this.props.provider);
        }
    }

    private handleLicenseOpen() {
        this.setState({licenseDialogOpen: true});
    }

    private handleLicenseClose() {
        this.setState({licenseDialogOpen: false});
    }

    private handleExpand() {
        this.setState(state => ({open: !state.open}));
    }

    private formatEstimate(providerEstimate) {
        if (!providerEstimate) {
            return '';
        }
        let sizeEstimate;
        let durationEstimate;
        // func that will return nf (not found) when the provided estimate is undefined
        const get = (estimate, nf = 'unknown' ) =>  (estimate) ? estimate.toString() : nf ;

        if (providerEstimate.size) {
            sizeEstimate = formatMegaBytes(providerEstimate.size.value);
        }
        if (providerEstimate.time) {
            const estimateInSeconds = providerEstimate.time.value;
            durationEstimate = getDuration(estimateInSeconds);
        }
        return `${get(sizeEstimate)} / ${get(durationEstimate)}`;
    }

    render() {
        const {colors} = this.props.theme.eventkit;
        const {classes, provider} = this.props;
        const {exportOptions} = this.props.exportInfo;
        // Take the current zoom from the current zoomLevels if they exist and the value is valid,
        // otherwise set it to the max allowable level.
        let currentMaxZoom = provider.level_to;
        if (exportOptions[provider.slug]) {
            const {maxZoom} = exportOptions[provider.slug];
            if (maxZoom || maxZoom === 0) {
                currentMaxZoom = maxZoom;
            }
        }

        // Show license if one exists.
        const nestedItems = [];
        if (provider.license) {
            nestedItems.push((
                <ListItem
                    key={nestedItems.length}
                    dense
                    disableGutters
                    className={`qa-DataProvider-ListItem-license ${classes.sublistItem}`}
                >
                    <div className={classes.prewrap}>
                        <i>
                            Use of this data is governed by&nbsp;
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={this.handleLicenseOpen}
                                onKeyPress={this.handleLicenseOpen}
                                className={classes.license}
                            >
                                {provider.license.name}
                            </span>
                        </i>
                        <BaseDialog
                            show={this.state.licenseDialogOpen}
                            title={provider.license.name}
                            onClose={this.handleLicenseClose}
                        >
                            <div className={classes.prewrap}>{provider.license.text}</div>
                        </BaseDialog>
                    </div>
                </ListItem>
            ));
        }
        if (supportsZoomLevels(this.props.provider)) {
            nestedItems.push(
                <div
                    className={`qa-DataProvider-ListItem-zoomSlider ${this.props.provider.slug + '-sliderDiv'}`}
                    key={this.props.provider.slug + '-sliderDiv'}
                    style={{padding: '10px 40px'}}
                >
                    <ZoomLevelSlider
                        updateZoom={this.setZoom}
                        zoom={currentMaxZoom}
                        maxZoom={provider.level_to}
                        minZoom={provider.level_from}
                    />
                </div>
            );

            nestedItems.push(
                <div
                    className={`qa-DataProvider-ListItem-zoomMap ${this.props.provider.slug + '-mapDiv'}`}
                    key={this.props.provider.slug + '-mapDiv'}
                    style={{padding: '10px 40px'}}
                >
                    <MapView
                        id={this.props.provider.id + "-map"}
                        url={this.props.provider.preview_url}
                        copyright={this.props.provider.service_copyright}
                        geojson={this.props.geojson}
                        setZoom={this.setZoom}
                        zoom={currentMaxZoom}
                        minZoom={this.props.provider.level_from}
                        maxZoom={this.props.provider.level_to}
                    />
                </div>
            );
        } else {
            nestedItems.push(
                <ListItem
                    className={`qa-DataProvider-ListItem-zoomSlider ${classes.sublistItem}`}
                    key={nestedItems.length}
                    dense
                    disableGutters
                >
                    <div>
                        <em>Zoom not available for this source.</em>
                    </div>
                </ListItem>);
        }

        nestedItems.push((
            <ListItem
                className={`qa-DataProvider-ListItem-provServDesc ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div
                    className={classes.prewrap}
                >
                    {provider.service_description || 'No provider description available.'}
                </div>
            </ListItem>
        ));

        nestedItems.push((
            <ListItem
                className={`qa-DataProvider-ListItem-provMaxAoi ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div className={classes.prewrap}>
                    <strong>Maximum selection area: </strong>
                    {((provider.max_selection == null ||
                            provider.max_selection === '' ||
                            parseFloat(provider.max_selection) <= 0) ?
                            'unlimited' : `${provider.max_selection} km²`
                    )}
                </div>
            </ListItem>
        ));

        nestedItems.push((
            <ListItem
                className={`qa-DataProvider-ListItem-provFormats ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div className={classes.prewrap}>
                    <span>
                        <strong>Select Format(s)</strong>
                        <div><em>Cartography only available with GeoPackage.</em></div>
                    </span>

                    <div style={{marginTop: '10px'}}>
                        <FormatSelector
                            formats={provider.supported_formats}
                            provider={provider}
                        />
                    </div>
                </div>
            </ListItem>
        ));

        // Only set this if we want to display the estimate
        let secondary;
        if (this.props.renderEstimate) {
            if (this.formatEstimate(provider.estimate)) {
                secondary =
                    <Typography style={{fontSize: "0.7em"}}>{this.formatEstimate(provider.estimate)}</Typography>;
            } else {
                secondary = <CircularProgress size={10}/>;
            }
        }

        const backgroundColor = (this.props.alt) ? colors.secondary : colors.white;

        return (
            <React.Fragment>
                <ListItem
                    className={`qa-DataProvider-ListItem ${classes.listItem}`}
                    key={provider.uid}
                    style={{backgroundColor}}
                    dense
                    disableGutters
                >
                    <div className={classes.container}>
                        <Checkbox
                            className="qa-DataProvider-CheckBox-provider"
                            classes={{root: classes.checkbox, checked: classes.checked}}
                            name={provider.name}
                            checked={this.props.checked}
                            onChange={this.props.onChange}
                        />
                        <ListItemText
                            disableTypography
                            classes={{root: classes.listItemText}}
                            primary={<Typography style={{fontSize: "1.0em"}}>{provider.name}</Typography>}
                            secondary={secondary}
                        />
                        <ProviderStatusIcon
                            id="ProviderStatus"
                            baseStyle={{marginRight: '40px'}}
                            availability={provider.availability}
                        />
                        {this.state.open ?
                            <ExpandLess className={classes.expand} onClick={this.handleExpand} color="primary"/>
                            :
                            <ExpandMore className={classes.expand} onClick={this.handleExpand} color="primary"/>
                        }
                    </div>
                </ListItem>
                <Collapse in={this.state.open} key={`${provider.uid}-expanded`}>
                    <List style={{backgroundColor}}>
                        {nestedItems}
                    </List>
                </Collapse>
            </React.Fragment>
        );
    }
}

DataProvider.defaultProps = {
    renderEstimate: false
};

function mapStateToProps(state, ownProps) {
    return {
        providerOptions: state.exportInfo.exportOptions[ownProps.provider.slug] || {} as Eventkit.Store.ProviderExportOptions,
        exportInfo: state.exportInfo,
        geojson: state.aoiInfo.geojson,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
    };
}

export default withTheme()(withStyles<any, any>(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataProvider)));
