import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Joyride, {Step, StoreHelpers} from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import MapCard from '../common/MapCard';
import CustomScrollbar from '../common/CustomScrollbar';
import CustomTableRow from '../common/CustomTableRow';
import { joyride } from '../../joyride.config';
import {isZoomLevelInRange, supportsZoomLevels} from "../../utils/generic";
import InfoDialog from "../Dialog/InfoDialog";
import {Link} from "@material-ui/core";
import EventkitJoyride from "../common/JoyrideWrapper";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    root: {
        width: '100%',
        backgroundImage: `url(${theme.eventkit.images.topo_light})`,
        backgroundRepeat: 'repeat repeat',
        justifyContent: 'space-around',
        display: 'flex',
        flexWrap: 'wrap',
        height: 'calc(100vh - 191px)',
    },
    form: {
        margin: '0 auto',
        width: '90%',
    },
    paper: {
        margin: '0 auto',
        padding: '20px',
        marginTop: '30px',
        marginBottom: '30px',
        width: '100%',
        maxWidth: '700px',
        overflow: 'hidden',
    },
    heading: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: theme.eventkit.colors.black,
        alignContent: 'flex-start',
        paddingBottom: '5px',
    },
    subHeading: {
        fontSize: '16px',
        alignContent: 'flex-start',
        color: theme.eventkit.colors.text_primary,
        paddingBottom: '10px',
    },
    exportHeading: {
        fontSize: '16px',
        alignContent: 'flex-start',
        color: theme.eventkit.colors.black,
        fontWeight: 'bold',
        paddingTop: '25px',
        paddingBottom: '10px',
    },
    mapCard: {
        paddingBottom: '20px',
        paddingTop: '15px',
    },
    map: {
        width: '100%',
    },
    exportInfoLine: {
        width: '100%',
        paddingLeft: '2em',
        textIndent: '-2em',
        margin: '0',
    },
    projectionInfoLine: {
        width: '100%',
        marginRight: '8px',
        display: 'inline-block',
    },
    name: {
        color: theme.eventkit.colors.primary,
        display: 'block',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        margin: '0px',
        '&:hover': {
            color: theme.eventkit.colors.primary,
            overflow: 'visible',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            backgroundColor: theme.eventkit.colors.secondary,
        },
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

export interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportName: string;
    datapackDescription: string;
    projectName: string;
    providers: Eventkit.Provider[];
    areaStr: string;
    exportOptions: Eventkit.Map<Eventkit.Store.ProviderExportOptions>;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string; };
    selectedProjections: number[];
    projections: Eventkit.Projection[];
    formats: Eventkit.Format[];
}

export interface State {
    steps: Step[];
    isRunning: boolean;
}

export class ExportSummary extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private joyride: Joyride;
    private helpers: StoreHelpers;
    private infoDialogRef;

    constructor(props: Props) {
        super(props);
        this.state = {
            steps: [],
            isRunning: false,
        };
        this.callback = this.callback.bind(this);
        this.getExportInfo = this.getExportInfo.bind(this);
        this.getProjectionInfo = this.getProjectionInfo.bind(this);
    }

    componentDidMount() {
        const steps = joyride.ExportSummary as any[];
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && !this.state.isRunning) {
            this?.helpers.reset(true);
            this.setState({ isRunning: true });
        }
    }

    private joyrideAddSteps(steps: Step[]) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) {
            return;
        }

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    private callback(data: any) {
        const { action, step, type } = data;
        if (action === 'close' || action === 'skip' || type === 'tour:end') {
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this?.helpers?.reset(true);
            window.location.hash = '';
        }

        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    }

    private getProjectionInfo(projectionSrids: number[]) {
        // Generate elements to display information about the export options for the specified provider.
        let index = 0; // Used for keys as React considers this to be a list.
        const generateSection = (content) => (<span className={this.props.classes.projectionInfoLine} key={index++}>{content}</span>);
        const exportInfo = [];
        projectionSrids.map((srid => {
            const projection = this.props.projections.find((proj) => proj.srid === srid);
            if (projection) {
                exportInfo.push(generateSection(`EPSG:${srid} - ${projection.name}`));
            } else {
                // If we can't find a corresponding projection object, display the SRID.
                exportInfo.push(generateSection(`EPSG:${srid}`));
            }
        }));
        return (<div className="projection-info" style={{paddingBottom: '10px'}}>{exportInfo.map((info) => info)}</div>);
    }

    private getExportInfo(provider: Eventkit.Provider) {
        // Generate elements to display information about the export options for the specified provider.
        const providerOptions = this.props.exportOptions[provider.slug];
        // Reusable func to add a section of text to the info.
        let index = 0; // Used for keys as React considers this to be a list.
        const generateSection = (content) => (<p className={this.props.classes.exportInfoLine} key={index++}>{content}</p>);
        const exportInfo = [];
        exportInfo.push((<p className={this.props.classes.exportInfoLine} style={{color: 'black'}} key="name">{provider.name}</p>));
        if (providerOptions) {
            if (supportsZoomLevels(provider)) {
                // For sources that support specifying a zoom level, check for and validate the values, otherwise use from/to
                const minZoom = isZoomLevelInRange(providerOptions.minZoom, provider) ? providerOptions.minZoom : provider.level_from;
                const maxZoom = isZoomLevelInRange(providerOptions.maxZoom, provider) ? providerOptions.maxZoom : provider.level_to;
                exportInfo.push(generateSection(`Zooms: ${minZoom}-${maxZoom}`));
            } else {
                // Source does not support zooming
                exportInfo.push(generateSection(`Zooms: Default zoom selected.`));
            }
            if (providerOptions.formats && !!provider.supported_formats) {
                // Formats should always be specified.
                const formatNames = provider.supported_formats.filter(
                    format => providerOptions.formats.indexOf(format.slug) >= 0).map(format => format.name);
                exportInfo.push(generateSection(`Formats: ${formatNames.join(', ')}`));
            }
        } else {
            // If we allow no options to be selected, display a default message.
            exportInfo.push(generateSection(`Default options selected.`));
        }
        return (<div className="source-info" style={{paddingBottom: '10px'}} key={provider.uid}>{exportInfo.map((info) => info)}</div>);
    }

    render() {
        const { formats, classes } = this.props;
        const { steps, isRunning } = this.state;
        const dataStyle = { color: 'black' };
        const formatSet = {};

        const providers = this.props.providers.filter(provider => (provider.display !== false));
        const projections = this.props.projections.filter(projection => this.props.selectedProjections.indexOf(projection.srid) !== -1);

        // Get all selected formats, and map them to the sources that have selected them.
        Object.entries(this.props.exportOptions).map(([slug, providerOptions], ix) => {
            providerOptions.formats.map((formatSlug) => {
                if (!formatSet.hasOwnProperty(formatSlug)) {
                    formatSet[formatSlug] = {
                        format: formats.find(format => format.slug === formatSlug),
                        sources: [providers.find(provider => provider.slug === slug)]
                    };
                } else {
                    formatSet[formatSlug].sources.push([providers.find(provider => provider.slug === slug)]);
                }
            })
        });

        return (
            <div id="root" className={classes.root}>
                <EventkitJoyride
                    name="Create Page Step 3"
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    continuous
                    showSkipButton
                    showProgress
                    getHelpers={(helpers: any) => {this.helpers = helpers}}
                    locale={{
                        back: (<span>Back</span>) as any,
                        close: (<span>Close</span>) as any,
                        last: (<span>Done</span>) as any,
                        next: (<span>Next</span>) as any,
                        skip: (<span>Skip</span>) as any,
                    }}
                    run={isRunning}
                />
                <CustomScrollbar>
                    <form id="form" className={`qa-ExportSummary-form ${classes.form}`}>
                        <Paper className={`qa-ExportSummary-Paper ${classes.paper}`} elevation={2}>
                            <div id="mainHeading" className={`qa-ExportSummary-mainHeading ${classes.heading}`}>
                                Preview and Run Export
                            </div>
                            <div id="subHeading" className={`qa-ExportSummary-subHeading ${classes.subHeading}`}>
                                Please make sure all the information below is correct.
                            </div>
                            <div className="qa-ExportSummary-div" id="Summary">
                                <div
                                    id="export-information-heading"
                                    className={`qa-ExportSummary-exportHeading ${classes.exportHeading}`}
                                >
                                    Export Information
                                </div>
                                <CustomTableRow
                                    className="qa-ExportSummary-name"
                                    title="Name"
                                    dataStyle={dataStyle}
                                >
                                    {this.props.exportName}
                                </CustomTableRow>
                                <CustomTableRow
                                    className="qa-ExportSummary-description"
                                    title="Description"
                                    dataStyle={dataStyle}
                                >
                                    {this.props.datapackDescription}
                                </CustomTableRow>
                                <CustomTableRow
                                    className="qa-ExportSummary-project"
                                    title="Project / Category"
                                    dataStyle={dataStyle}
                                >
                                    {this.props.projectName}
                                </CustomTableRow>
                                <CustomTableRow
                                    className="qa-ExportSummary-sources"
                                    title="Data Sources"
                                    dataStyle={{display: 'block'}}
                                >
                                    {providers.map(provider => this.getExportInfo(provider))}
                                    <div style={{display: 'flex', cursor: 'pointer'}}>
                                        <InfoDialog
                                            title="Source and Format Details"
                                            style={{marginRight: '5px'}}
                                            iconProps={{style:{width: '24px', marginRight: '5px'}}}
                                            ref={(instance) => {
                                                this.infoDialogRef = instance;
                                            }}
                                        >
                                            <div style={{display: 'grid', fontSize: '14px'}}>
                                                <strong style={{fontSize: '1.5em', paddingBottom: '5p'}}>Source(s):</strong>
                                                {providers.map((provider) => (
                                                        <div style={{padding: '3px'}}>
                                                            <div className={classes.infoItem}>
                                                                <strong>
                                                                    {provider.name}:
                                                                </strong>
                                                                <span>{provider.service_description}</span></div>
                                                        </div>
                                                    )
                                                )}
                                                <strong style={{fontSize: '1.5em', paddingBottom: '5px', paddingTop: '5px'}}>Format(s):</strong>
                                                {Object.entries(formatSet).map(([slug, object])=> (
                                                    <div style={{padding: '3px'}}>
                                                        <div className={classes.infoItem}>
                                                            <strong>
                                                                {(object as any).format.name}:
                                                            </strong>
                                                            <span>{(object as any).format.description}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </InfoDialog>
                                        <Link
                                            className={this.props.classes.name}
                                            onClick={() => {this.infoDialogRef.openDialog()}}
                                        >
                                            Source and Format Details
                                        </Link>
                                    </div>
                                </CustomTableRow>
                                <CustomTableRow
                                    className="qa-ExportSummary-projections"
                                    title="Projection(s)"
                                    dataStyle={dataStyle}
                                >
                                    {this.getProjectionInfo(this.props.selectedProjections)}
                                </CustomTableRow>
                                <div id="aoi-heading" className={`qa-ExportSummary-aoiHeading ${classes.exportHeading}`} >
                                    Area of Interest (AOI)
                                </div>
                                <CustomTableRow
                                    className="qa-ExportsSummary-area"
                                    title="Area"
                                    dataStyle={dataStyle}
                                >
                                    {this.props.areaStr}
                                </CustomTableRow>
                            </div>
                            <div id="aoi-map" className={`qa-ExportSummary-map ${classes.mapCard}`}>
                                <MapCard geojson={this.props.geojson}>
                                    Selected Area of Interest
                                </MapCard>
                            </div>
                        </Paper>
                    </form>
                </CustomScrollbar>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportName: state.exportInfo.exportName,
        datapackDescription: state.exportInfo.datapackDescription,
        projectName: state.exportInfo.projectName,
        providers: state.exportInfo.providers,
        areaStr: state.exportInfo.areaStr,
        exportOptions: state.exportInfo.exportOptions,
        selectedProjections: state.exportInfo.projections,
        projections: state.projections,
    };
}

export default withTheme(withStyles(jss)(connect(mapStateToProps)(ExportSummary)));
