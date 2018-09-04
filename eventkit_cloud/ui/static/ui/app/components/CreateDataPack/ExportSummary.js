import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Joyride from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import MapCard from '../common/MapCard';
import CustomScrollbar from '../CustomScrollbar';
import CustomTableRow from '../CustomTableRow';
import { joyride } from '../../joyride.config';

export class ExportSummary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            steps: [],
            isRunning: false,
        };
        this.callback = this.callback.bind(this);
    }

    componentDidMount() {
        const steps = joyride.ExportSummary;
        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.walkthroughClicked && !this.props.walkthroughClicked && !this.state.isRunning) {
            this.joyride.reset(true);
            this.setState({ isRunning: true });
        }
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    callback(data) {
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
        const { theme } = this.props;
        const { steps, isRunning } = this.state;

        const styles = {
            root: {
                width: '100%',
                backgroundImage: `url(${theme.eventkit.images.topo_light})`,
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: window.innerHeight - 191,
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
                color: 'black',
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
                color: 'black',
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
        };

        const providers = this.props.providers.filter(provider => (provider.display !== false));
        return (
            <div id="root" style={styles.root}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                <CustomScrollbar>
                    <form id="form" style={styles.form} className="qa-ExportSummary-form">
                        <Paper className="qa-ExportSummary-Paper" style={styles.paper} elevation={2}>
                            <div id="mainHeading" className="qa-ExportSummary-mainHeading" style={styles.heading}>
                                Preview and Run Export
                            </div>
                            <div id="subHeading" style={styles.subHeading} className="qa-ExportSummary-subHeading">
                                Please make sure all the information below is correct.
                            </div>
                            <div className="qa-ExportSummary-div" id="Summary">
                                <div
                                    id="export-information-heading"
                                    className="qa-ExportSummary-exportHeading"
                                    style={styles.exportHeading}
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
                                <div id="aoi-heading" className="qa-ExportSummary-aoiHeading" style={styles.exportHeading}>
                                    Area of Interest (AOI)
                                </div>
                                <CustomTableRow
                                    className="qa-ExportsSummary-area"
                                    title="Area"
                                    data={this.props.areaStr}
                                />
                            </div>
                            <div id="aoi-map" className="qa-ExportSummary-map" style={styles.mapCard}>
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

ExportSummary.contextTypes = {
    config: PropTypes.object,
};

ExportSummary.propTypes = {
    geojson: PropTypes.object.isRequired,
    exportName: PropTypes.string.isRequired,
    datapackDescription: PropTypes.string.isRequired,
    projectName: PropTypes.string.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    areaStr: PropTypes.string.isRequired,
    walkthroughClicked: PropTypes.bool.isRequired,
    onWalkthroughReset: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(connect(
    mapStateToProps,
    null,
)(ExportSummary));
