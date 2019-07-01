import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Joyride, { Step } from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import MapCard from '../common/MapCard';
import CustomScrollbar from '../CustomScrollbar';
import CustomTableRow from '../CustomTableRow';
import { joyride } from '../../joyride.config';

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
});

export interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportName: string;
    datapackDescription: string;
    projectName: string;
    providers: Eventkit.Provider[];
    areaStr: string;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string; };
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
    constructor(props: Props) {
        super(props);
        this.state = {
            steps: [],
            isRunning: false,
        };
        this.callback = this.callback.bind(this);
    }

    componentDidMount() {
        const steps = joyride.ExportSummary as any[];
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && !this.state.isRunning) {
            this.joyride.reset(true);
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
        if (action === 'close' || action === 'skip' || type === 'finished') {
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this.joyride.reset(true);
            window.location.hash = '';
        }

        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    }

    render() {
        const { classes } = this.props;
        const { steps, isRunning } = this.state;

        const providers = this.props.providers.filter(provider => (provider.display !== false));
        return (
            <div id="root" className={classes.root}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
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
                                    data={this.props.exportName}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-description"
                                    title="Description"
                                    data={this.props.datapackDescription}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-project"
                                    title="Project / Category"
                                    data={this.props.projectName}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-sources"
                                    title="Data Sources"
                                    data={providers.map(provider => <p style={{ width: '100%' }} key={provider.uid}>{provider.name}</p>)}
                                />
                                <div id="aoi-heading" className={`qa-ExportSummary-aoiHeading ${classes.exportHeading}`} >
                                    Area of Interest (AOI)
                                </div>
                                <CustomTableRow
                                    className="qa-ExportsSummary-area"
                                    title="Area"
                                    data={this.props.areaStr}
                                />
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
    };
}

export default withTheme()(withStyles(jss)(connect(mapStateToProps)(ExportSummary)));
