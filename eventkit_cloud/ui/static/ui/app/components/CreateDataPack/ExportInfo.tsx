import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import axios from 'axios';
import cookie from 'react-cookie';
import Joyride, { Step } from 'react-joyride';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import ActionCheckCircle from '@material-ui/icons/CheckCircle';
import Info from '@material-ui/icons/Info';
import NavigationRefresh from '@material-ui/icons/Refresh';
import CustomScrollbar from '../CustomScrollbar';
import DataProvider, { ProviderData } from './DataProvider';
import MapCard from '../common/MapCard';
import { updateExportInfo } from '../../actions/datacartActions';
import { stepperNextDisabled, stepperNextEnabled } from '../../actions/uiActions';
import BaseDialog from '../Dialog/BaseDialog';
import CustomTextField from '../CustomTextField';
import CustomTableRow from '../CustomTableRow';
import { joyride } from '../../joyride.config';
import { getSqKmString } from '../../utils/generic';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    underlineStyle: {
        width: 'calc(100% - 10px)',
        left: '5px',
    },
    window: {
        height: 'calc(100vh - 180px)',
    },
    root: {
        width: '100%',
        height: 'calc(100vh - 180px)',
        backgroundImage: `url(${theme.eventkit.images.topo_light})`,
        backgroundRepeat: 'repeat repeat',
        justifyContent: 'space-around',
        display: 'flex',
        flexWrap: 'wrap',
    },
    form: {
        margin: '0 auto',
        width: '90%',
        height: 'calc(100vh - 180px)',
    },
    paper: {
        margin: '0px auto',
        padding: '20px',
        marginTop: '30px',
        marginBottom: '30px',
        width: '100%',
        maxWidth: '700px',
    },
    heading: {
        fontSize: '18px',
        fontWeight: 'bold',
        paddingBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        lineHeight: '25px',
    },
    textField: {
        marginTop: '15px',
        backgroundColor: theme.eventkit.colors.secondary,
    },
    input: {
        fontSize: '16px',
        paddingLeft: '5px',
        paddingRight: '50px',
    },
    listHeading: {
        fontSize: '16px',
        fontWeight: 300,
        display: 'flex',
        padding: '0px 10px',
    },
    refreshIcon: {
        height: '22px',
        marginLeft: '5px',
        cursor: 'pointer',
        verticalAlign: 'bottom',
    },
    sectionBottom: {
        paddingBottom: '30px',
    },
    projections: {
        padding: '0px 10px',
        display: 'flex',
        lineHeight: '24px',
    },
    infoIcon: {
        height: '24px',
        width: '24px',
        cursor: 'pointer',
    },
    editAoi: {
        fontSize: '15px',
        fontWeight: 'normal',
        verticalAlign: 'top',
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
    },
});

export interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    nextEnabled: boolean;
    handlePrev: () => void;
    updateExportInfo: (args: any) => void;
    setNextDisabled: () => void;
    setNextEnabled: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export interface State {
    projectionsDialogOpen: boolean;
    steps: Step[];
    isRunning: boolean;
    providers: ProviderData[];
    refreshPopover: null | HTMLElement;
}

export class ExportInfo extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private joyride;
    constructor(props: Props) {
        super(props);
        this.state = {
            projectionsDialogOpen: false,
            steps: [],
            isRunning: false,
            // we make a local copy of providers for editing
            providers: props.providers,
            refreshPopover: null,
        };
        this.onNameChange = this.onNameChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.onProjectChange = this.onProjectChange.bind(this);
        this.hasRequiredFields = this.hasRequiredFields.bind(this);
        this.hasDisallowedSelection = this.hasDisallowedSelection.bind(this);
        this.callback = this.callback.bind(this);
        this.handleProjectionsClose = this.handleProjectionsClose.bind(this);
        this.handleProjectionsOpen = this.handleProjectionsOpen.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
        this.getAvailability = this.getAvailability.bind(this);
        this.checkAvailability = this.checkAvailability.bind(this);
        this.checkProviders = this.checkProviders.bind(this);
        this.handlePopoverOpen = this.handlePopoverOpen.bind(this);
        this.handlePopoverClose = this.handlePopoverClose.bind(this);

        this.joyride = React.createRef();
    }

    componentDidMount() {
        // if the state does not have required data disable next
        if (!this.hasRequiredFields(this.props.exportInfo) ||
            this.hasDisallowedSelection(this.props.exportInfo)) {
            this.props.setNextDisabled();
        }

        // calculate the area of the AOI
        const areaStr = getSqKmString(this.props.geojson);

        this.props.updateExportInfo({
            ...this.props.exportInfo,
            areaStr,
        });

        // make requests to check provider availability
        if (this.state.providers) {
            this.checkProviders(this.state.providers);
        }

        const steps = joyride.ExportInfo as any[];
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps: Props) {
        // if currently in walkthrough, we want to be able to show the green forward button, so ignore these statements
        if (!this.props.walkthroughClicked) {
        // if required fields are fulfilled enable next
            if (this.hasRequiredFields(this.props.exportInfo) &&
                !this.hasDisallowedSelection(this.props.exportInfo)) {
                if (!this.props.nextEnabled) {
                    this.props.setNextEnabled();
                }
            } else if (this.props.nextEnabled) {
                // if not and next is enabled it should be disabled
                this.props.setNextDisabled();
            }
        }
        if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && !this.state.isRunning) {
            this.joyride.current.reset(true);
            this.setState({ isRunning: true });
        }

        if (this.props.providers.length !== prevProps.providers.length) {
            this.setState({ providers: this.props.providers });
            this.checkProviders(this.props.providers);
        }
    }

    private onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            exportName: e.target.value,
        });
    }

    private onDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            datapackDescription: e.target.value,
        });
    }

    private onProjectChange(e: React.ChangeEvent<HTMLInputElement>) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            projectName: e.target.value,
        });
    }

    private onChangeCheck(e: React.ChangeEvent<HTMLInputElement>) {
        // current array of providers
        const providers = [...this.props.exportInfo.providers];
        const propsProviders = this.props.providers;
        let index;
        // check if the check box is checked or unchecked
        if (e.target.checked) {
            // add the provider to the array
            for (const provider of propsProviders) {
                if (provider.name === e.target.name) {
                    providers.push(provider);
                    break;
                }
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = providers.map(x => x.name).indexOf(e.target.name);
            for (const provider of propsProviders) {
                if (provider.name === e.target.name) {
                    providers.splice(index, 1);
                }
            }
        }

        // update the state with the new array of options
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            providers,
        });
    }

    private onRefresh() {
        // make a copy of providers and set availability to empty json
        const providers = this.state.providers.map(provider => (
            { ...provider, availability: { slug: undefined, type: undefined, status: undefined, message: undefined } }
        ));
        // update state with the new copy of providers
        this.setState({ providers });

        // check all of providers again
        providers.forEach((provider) => {
            this.checkAvailability(provider);
        });
    }

    private getAvailability(provider: Eventkit.Provider, data: any) {
        // make a copy of the provider to edit
        const newProvider = { ...provider } as ProviderData;

        const csrfmiddlewaretoken = cookie.load('csrftoken');
        return axios({
            url: `/api/providers/${provider.slug}/status`,
            method: 'POST',
            data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            newProvider.availability = JSON.parse(response.data);
            newProvider.availability.slug = provider.slug;
            return newProvider;
        }).catch(() => {
            newProvider.availability = {
                slug: undefined,
                status: 'WARN',
                type: 'CHECK_FAILURE',
                message: "An error occurred while checking this provider's availability.",
            };
            newProvider.availability.slug = provider.slug;
            return newProvider;
        });
    }

    async checkAvailability(provider: ProviderData) {
        const data = { geojson: this.props.geojson };
        const newProvider = await this.getAvailability(provider, data);
        this.setState((prevState) => {
            // make a copy of state providers and replace the one we updated
            const providers = [...prevState.providers];
            providers.splice(providers.indexOf(provider), 1, newProvider);
            return { providers };
        });
    }

    private checkProviders(providers: ProviderData[]) {
        providers.forEach((provider) => {
            if (provider.display === false) {
                return;
            }
            this.checkAvailability(provider);
        });
    }

    private handleProjectionsClose() {
        this.setState({ projectionsDialogOpen: false });
    }

    private handleProjectionsOpen() {
        this.setState({ projectionsDialogOpen: true });
    }

    private handlePopoverOpen(e: React.MouseEvent<any>) {
        this.setState({ refreshPopover: e.currentTarget });
    }

    private handlePopoverClose() {
        this.setState({ refreshPopover: null });
    }

    private hasRequiredFields(exportInfo: Eventkit.Store.ExportInfo) {
        // if the required fields are populated return true, else return false
        return exportInfo.exportName
            && exportInfo.datapackDescription
            && exportInfo.projectName
            && exportInfo.providers.length > 0;
    }

    private hasDisallowedSelection(exportInfo: Eventkit.Store.ExportInfo) {
        // if any unacceptable providers are selected return true, else return false
        return exportInfo.providers.some((provider) => {
            // short-circuiting means that this shouldn't be called until provider.availability
            // is populated, but if it's not, return false
            const providerState = this.state.providers.find(p => p.slug === provider.slug);
            if (!providerState) {
                return false;
            }
            const { availability } = providerState;
            if (availability && availability.status) {
                return availability.status.toUpperCase() === 'FATAL';
            }
            return false;
        });
    }

    private joyrideAddSteps(steps: Step[]) {
        const newSteps = steps;
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
        this.props.setNextDisabled();
        if (action === 'close' || action === 'skip' || type === 'finished') {
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this.joyride.current.reset(true);
            window.location.hash = '';
        }

        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }

        if (data.index === 5 && data.type === 'tooltip:before') {
            this.props.setNextEnabled();
        }
    }

    render() {
        const { classes } = this.props;
        const { steps, isRunning } = this.state;

        const providers = this.state.providers.filter(provider => (provider.display !== false));

        return (
            <div id="root" className={`qa-ExportInfo-root ${classes.root}`} >
                <Joyride
                    callback={this.callback}
                    ref={this.joyride}
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
                    <form id="form" className={`qa-ExportInfo-form ${classes.form}`}>
                        <Paper
                            id="paper"
                            className={`qa-ExportInfo-Paper ${classes.paper}`}
                            elevation={2}
                        >
                            <div className="qa-ExportInfo-general-info" id="GeneralInfo">
                                <div
                                    id="mainHeading"
                                    className={`qa-ExportInfo-mainHeading ${classes.heading}`}
                                >
                                    Enter General Information
                                </div>
                                <div style={{ marginBottom: '30px' }}>
                                    <CustomTextField
                                        className={`qa-ExportInfo-input-name ${classes.textField}`}
                                        id="Name"
                                        name="exportName"
                                        onChange={this.onNameChange}
                                        defaultValue={this.props.exportInfo.exportName}
                                        placeholder="Datapack Name"
                                        InputProps={{ className: classes.input }}
                                        fullWidth
                                        maxLength={100}
                                    />
                                    <CustomTextField
                                        className={`qa-ExportInfo-input-description ${classes.textField}`}
                                        id="Description"
                                        name="datapackDescription"
                                        onChange={this.onDescriptionChange}
                                        defaultValue={this.props.exportInfo.datapackDescription}
                                        placeholder="Description"
                                        multiline
                                        inputProps={{ style: { fontSize: '16px', lineHeight: '20px' } }}
                                        fullWidth
                                        maxLength={250}
                                        // eslint-disable-next-line react/jsx-no-duplicate-props
                                        InputProps={{ className: classes.input, style: { lineHeight: '21px' } }}
                                    />
                                    <CustomTextField
                                        className={`qa-ExportInfo-input-project ${classes.textField}`}
                                        id="Project"
                                        name="projectName"
                                        onChange={this.onProjectChange}
                                        defaultValue={this.props.exportInfo.projectName}
                                        placeholder="Project Name"
                                        InputProps={{ className: classes.input }}
                                        fullWidth
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                            <div className={classes.heading}>
                                <div id="layersHeader" className="qa-ExportInfo-layersHeader" style={{ marginRight: '5px' }}>
                                    Select Data Sources
                                </div>
                                <div id="layersSubheader" style={{ fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic' }}>
                                    (You must choose <strong>at least one</strong>)
                                </div>
                            </div>
                            <div className={classes.sectionBottom}>
                                <div className={`qa-ExportInfo-ListHeader ${classes.listHeading}`}>
                                    <div
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={{ flex: '1 1 auto' }}
                                    >
                                        DATA PROVIDERS
                                    </div>
                                    <div
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}
                                    >
                                        <span>AVAILABILITY</span>
                                        <NavigationRefresh
                                            className={classes.refreshIcon}
                                            onMouseEnter={this.handlePopoverOpen}
                                            onMouseLeave={this.handlePopoverClose}
                                            onClick={this.onRefresh}
                                            color="primary"
                                        />
                                        <Popover
                                            style={{ pointerEvents: 'none' }}
                                            PaperProps={{
                                                style: { padding: '16px' },
                                            }}
                                            open={Boolean(this.state.refreshPopover)}
                                            anchorEl={this.state.refreshPopover}
                                            onClose={this.handlePopoverClose}
                                            anchorOrigin={{
                                                vertical: 'top',
                                                horizontal: 'center',
                                            }}
                                            transformOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'center',
                                            }}
                                        >
                                            <div style={{ maxWidth: 400 }}>
                                                <Typography variant="h6" gutterBottom style={{ fontWeight: 600 }}>
                                                    RUN AVAILABILITY CHECK AGAIN
                                                </Typography>
                                                <div>You may try to resolve errors by running the availability check again.</div>
                                            </div>
                                        </Popover>
                                    </div>
                                </div>
                                <List
                                    id="ProviderList"
                                    className="qa-ExportInfo-List"
                                    style={{ width: '100%', fontSize: '16px' }}
                                >
                                    {providers.map((provider, ix) => (
                                        <DataProvider
                                            key={provider.slug}
                                            provider={provider}
                                            onChange={this.onChangeCheck}
                                            checked={this.props.exportInfo.providers.map(x => x.name)
                                                .indexOf(provider.name) !== -1}
                                            alt={ix % 2 === 0}
                                        />
                                    ))}
                                </List>
                            </div>

                            <div
                                id="projectionHeader"
                                className={`qa-ExportInfo-projectionHeader ${classes.heading}`}
                            >
                                Select Projection
                            </div>
                            <div className={classes.sectionBottom}>
                                <div id="Projections" className={`qa-ExportInfo-projections ${classes.projections}`}>
                                    <Checkbox
                                        className="qa-ExportInfo-CheckBox-projection"
                                        name="EPSG:4326"
                                        checked
                                        style={{ width: '24px', height: '24px' }}
                                        disabled
                                        checkedIcon={<ActionCheckCircle className="qa-ExportInfo-ActionCheckCircle-projection" />}
                                    />
                                    <span style={{ padding: '0px 15px', display: 'flex', flexWrap: 'wrap' }}>
                                        EPSG:4326 - World Geodetic System 1984 (WGS84)
                                    </span>
                                    <Info
                                        className={`qa-ExportInfo-Info-projection ${classes.infoIcon}`}
                                        onClick={this.handleProjectionsOpen}
                                        color="primary"
                                    />
                                    <BaseDialog
                                        show={this.state.projectionsDialogOpen}
                                        title="Projection Information"
                                        onClose={this.handleProjectionsClose}
                                    >
                                        <div
                                            style={{ paddingBottom: '10px', wordWrap: 'break-word' }}
                                            className="qa-ExportInfo-dialog-projection"
                                        >
                                            All geospatial data provided by EventKit are in the
                                             World Geodetic System 1984 (WGS 84) projection.
                                             This projection is also commonly known by its EPSG code: 4326.
                                             Additional projection support will be added in subsequent versions.
                                        </div>
                                    </BaseDialog>
                                </div>
                            </div>
                            <div id="aoiHeader" className={`qa-ExportInfo-AoiHeader ${classes.heading}`}>
                                Area of Interest (AOI)
                            </div>
                            <div className={classes.sectionBottom}>
                                <CustomTableRow
                                    className="qa-ExportInfo-area"
                                    title="Area"
                                    data={this.props.exportInfo.areaStr}
                                    containerStyle={{ fontSize: '16px' }}
                                />
                                <div style={{ padding: '15px 0px 20px' }}>
                                    <MapCard geojson={this.props.geojson}>
                                        <span style={{ marginRight: '10px' }}>Selected Area of Interest</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={this.props.handlePrev}
                                            onKeyPress={this.props.handlePrev}
                                            className={classes.editAoi}
                                        >
                                            Edit
                                        </span>
                                    </MapCard>
                                </div>
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
        exportInfo: state.exportInfo,
        providers: state.providers,
        nextEnabled: state.stepperNextEnabled,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled());
        },
    };
}

export default withTheme()(withStyles(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportInfo)));
