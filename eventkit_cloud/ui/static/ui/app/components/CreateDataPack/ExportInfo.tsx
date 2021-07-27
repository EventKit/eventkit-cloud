import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import {connect} from 'react-redux';
import axios from 'axios';
import {getSqKmString} from '../../utils/generic';
import {Step} from 'react-joyride';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import NavigationRefresh from '@material-ui/icons/Refresh';
import CustomScrollbar from '../common/CustomScrollbar';
import DataProvider from './DataProvider';
import MapCard from '../common/MapCard';
import {updateExportInfo} from '../../actions/datacartActions';
import {stepperNextDisabled, stepperNextEnabled} from '../../actions/uiActions';
import CustomTextField from '../common/CustomTextField';
import CustomTableRow from '../common/CustomTableRow';
import BaseDialog from "../Dialog/BaseDialog";
import AlertWarning from '@material-ui/icons/Warning';
import {useDebouncedState} from "../../utils/hooks/hooks";
import RequestDataSource from "./RequestDataSource";
import {
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Link,
    Radio,
    RadioGroup,
    TextField
} from "@material-ui/core";
import EventkitJoyride from "../common/JoyrideWrapper";
import {Step2Validator} from "./ExportValidation";
import {useAppContext} from "../ApplicationContext";
import {renderIf} from "../../utils/renderIf";

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
    searchFilterContainer: {
        alignItems: 'stretch',
        padding: '20px',
        marginBottom: '20px'
    },
    searchLabel: {
        fontSize: '15px',
        fontWeight: 'normal',
        verticalAlign: 'top',
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
        float: 'left',
    },
    filterLabel: {
        fontSize: '15px',
        fontWeight: 'normal',
        verticalAlign: 'top',
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
        float: 'right',
    },
    filterContainer: {
        display: 'block',
        flexWrap: 'wrap',
        width: '100%',
        zIndex: 1,
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
        display: 'block',
        lineHeight: '24px',
    },
    selectAll: {
        padding: '0px 10px 10px 16px',
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
    radio: {
        width: '24px',
        height: '24px',
        marginRight: '15px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
    },
    checked: {},
    stickyRow: {
        height: '50px',
        display: 'flex',
    },
    stickyRowItems: {
        flexGrow: 1,
    },
});

// Use this to keep track of incompatibilities in the user selected DataPack options
export interface IncompatibilityInfo {
    formats: {
        [slug: string]: {
            projections: number[]; // Map format slugs to the projection SRID's that it is NOT compatible with.
        }
    };
    projections: {
        [srid: number]: {
            formats: Eventkit.Format[]; // Map projection SRID's to the format it is NOT compatible with.
        }
    };
}

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
    onUpdateEstimate?: () => void;
    projections: Eventkit.Projection[];
    formats: Eventkit.Format[];
    checkProvider: any;
}

export interface State {
    steps: Step[];
    isRunning: boolean;
    providers: Eventkit.Provider[];
    displayDummy: boolean;
    refreshPopover: null | HTMLElement;
    projectionCompatibilityOpen: boolean;
    displaySrid: number;  // Which projection is shown in the compatibility warning box
    selectedFormats: string[];
    incompatibilityInfo: IncompatibilityInfo;
    providerDrawerIsOpen: boolean;
    stepIndex: number;
}

const dummyProvider = {
    uid: 'notreal',
    slug: 'slug',
    name: 'Example Map Service',
    max_selection: '10000',
    type: 'wmts',
    service_description: 'This is an example service used for demonstration purposes',
    license: {
        text: 'test license text',
        name: 'test license',
    },
    level_from: 0,
    level_to: 13,
    supported_formats: [{
        uid: 'fakeduid',
        url: 'http://cloud.eventkit.test/api/formats/gpkg',
        slug: 'gpkg',
        name: 'Geopackage',
        description: 'GeoPackage',
        supported_projections: [{srid: 4326, name: '', description: ''}],
    } as Eventkit.Format],
} as Eventkit.Provider;

export function ExportInfo(props: Props) {
    const [steps, setSteps] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [providers, setProviders] = useState(props.providers);
    const [providerSearch, setProviderSearch] = useState("");
    const [showProviderSearch, setShowProviderSearch] = useState(false);
    const [showProviderFilter, setShowProviderFilter] = useState(false);
    const [providerFilterList, setProviderFilterList] = useState([]);
    const [providerSortOption, setProviderSortOption] = useState("");
    const [providerFilterChecked, setProviderFilterChecked] = useState({});
    const [refreshPopover, setRefreshPopover] = useState(null);
    const [projectionCompatibilityOpen, setProjectionCompatibilityOpen] = useState(false);
    const [displaySrid, setDisplaySrid] = useState(null);
    const [selectedFormats, setSelectedFormats] = useState([]);
    const [incompatibilityInfo, setIncompatibilityInfo] = useState(({
        formats: {},
        projections: {}
    } as IncompatibilityInfo));
    const [providerDrawerIsOpen, setProviderDrawerIsOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [displayDummy, setDisplayDummy] = useState(false);

    const appContext = useAppContext();
    const {colors} = props.theme.eventkit;
    const {classes} = props;

    const helpers = useRef();
    let joyride; // = useRef();
    const dataProvider = useRef();
    const bounceBack = useRef();
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Move EPSG:4326 (if present -- it should always be) to the front so it displays first.
    let projections = [...props.projections];
    const indexOf4326 = projections.map(projection => projection.srid).indexOf(4326);
    if (indexOf4326 >= 1) {
        projections = [projections.splice(indexOf4326, 1)[0], ...projections];
    }

    // Component mount and unmount
    useEffect(() => {
        // calculate the area of the AOI
        const areaStr = getSqKmString(props.geojson);
        const updatedInfo = ({
            areaStr,
            visibility: this?.context?.config?.DATAPACKS_DEFAULT_SHARED ? 'PUBLIC' : 'PRIVATE'
        } as Eventkit.Store.ExportInfo);
        const steps = (joyride.ExportInfo as any[]);
        joyrideAddSteps(steps);

        if (props.projections.find(projection => projection.srid === 4326)) {
            if (props.exportInfo.projections && props.exportInfo.projections.length === 0) {
                updatedInfo.projections = [4326];
            }
        }

        props.updateExportInfo(updatedInfo);

        // TODO: Create the providerFilterChecked object with default values of false.
        // props.providers.map()

        return () => {
            source.cancel('Exiting Page.');
        };
    }, []);


    // componentDidUpdate(prevProps: Props, prevState: State) {
    //     // if currently in walkthrough, we want to be able to show the green forward button, so ignore these statements
    //     const {exportInfo} = this.props;
    //     let nextState = {};
    //
    //     if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && !this.state.isRunning) {
    //         this.joyride?.current?.reset(true);
    //         this.setState({isRunning: true});
    //     }
    //
    //     if (this.props.providers.length !== prevProps.providers.length) {
    //         this.setState({providers: this.props.providers});
    //     } else {
    //         const providerSlugs = this.props.providers.map(provider => provider.slug);
    //         const prevProviderSlugs = prevProps.providers.map(provider => provider.slug);
    //         if (providerSlugs.some(slug => !arrayHasValue(prevProviderSlugs, slug))) {
    //             this.setState({providers: this.props.providers});
    //         }
    //     }
    //
    //     const selectedProjections = [...exportInfo.projections];
    //     const prevSelectedProjections = [...prevProps.exportInfo.projections];
    //     if (!ExportInfo.elementsEqual(selectedProjections, prevSelectedProjections)) {
    //         nextState = {
    //             ...nextState,
    //             ...this.checkCompatibility()
    //         };
    //     }
    //     nextState = {
    //         ...nextState,
    //         ...this.checkSelectedFormats(prevState)
    //     };
    //     if (Object.keys(nextState).length > 0) {
    //         this.setState({...nextState});
    //     }
    // }

    // TODO: Just make this an object instead of a function?
    const buildFilters = () => {
        return [
            {
                name: "Type",
                filterType: "type",
                options: [
                    {
                        name: "Raster",
                        filterType: "type",
                        slug: "raster"
                    },
                    {
                        name: "Vector",
                        filterType: "type",
                        slug: "vector"
                    },
                    {
                        name: "Elevation",
                        filterType: "type",
                        slug: "elevation"
                    }
                ]
            }
        ]
    };

    const buildSortOptions = () => {
        return [
            {
                "name": "Alphabetical A-Z",
                "slug": "alphabetical-a-z"
            },
            {
                "name": "Alphabetical Z-A",
                "slug": "alphabetical-z-a"
            },
            {
                "name": "Newest First",
                "slug": "newest-first",
            },
            {
                "name": "Oldest First",
                "slug": "oldest-first"
            }
        ]
    }

    const elementsEqual = (array1, array2) => {
        // To compare two arrays for equality, we check length for an early exit,
        // otherwise we sort them then compare element by element.
        if (array1.length !== array2.length) {
            return false;
        }
        // This code will only run if the arrays are the same length
        array1.sort();
        array2.sort();
        let valuesEqual = true;
        array1.forEach((item, index) => {
            if (item !== array2[index]) {
                valuesEqual = false;
                return;
            }
        });
        return valuesEqual;
    }

    const checkCompatibility = () => {
        const {formats} = props;
        const selectedProjections = props.exportInfo.projections;

        const formatMap = {};
        const projectionMap = {};
        formats.forEach(format => {
            const formatSupportedProjections = format.supported_projections.map(projection => projection.srid);
            selectedProjections.forEach(selectedProjection => {
                if (!formatMap[format.slug]) {
                    formatMap[format.slug] = {projections: []};
                }
                if (!projectionMap[selectedProjection]) {
                    projectionMap[selectedProjection] = {formats: []};
                }
                if (!formatSupportedProjections.includes(selectedProjection)) {
                    projectionMap[selectedProjection].formats.push(format);
                    formatMap[format.slug].projections.push(selectedProjection);
                }
            });
        });

        return {
            incompatibilityInfo: {
                ...incompatibilityInfo,
                formats: formatMap,
                projections: projectionMap,
            }
        };
    }

    const checkShareAll = () => {
        if (props.exportInfo.visibility === 'PRIVATE') {
            props.updateExportInfo({
                visibility: 'PUBLIC'
            });
            return;
        }
        props.updateExportInfo({
            visibility: 'PRIVATE'
        });
    }

    const checkSelectedFormats = (prevState: State) => {
        // exportInfo.providers is the list of selected providers, i.e. what will be included in the DataPack.
        // props.providers is the list of available providers.
        const exportOptions = props.exportInfo.exportOptions;
        const providers = [...props.exportInfo.providers];
        const getFormats = (formatArray) => {
            providers.forEach((provider) => {
                const providerOptions = exportOptions[provider.slug];
                if (providerOptions && !!providerOptions.formats) {
                    providerOptions.formats.forEach(formatSlug => {
                        if (formatArray.indexOf(formatSlug) < 0) {
                            formatArray.push(formatSlug);
                        }
                    });
                }
            });
        };
        const selectedFormats = [] as string[];
        getFormats(selectedFormats);
        if (!elementsEqual(selectedFormats, prevState.selectedFormats)) {
            return {selectedFormats};
        }
    }

    const handleProjectionCompatibilityOpen = (projection: Eventkit.Projection) => {
        setDisplaySrid(projection.srid);
        setProjectionCompatibilityOpen(true);
    }

    const handleProjectionCompatibilityClose = () => {
        setProjectionCompatibilityOpen(false);
    }

    const handleDataProviderExpand = () => {
        // @ts-ignore
        dataProvider.current.handleExpand();
    }

    const onNameChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        props.updateExportInfo({
            exportName: value,
        });
    }

    const onDescriptionChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        props.updateExportInfo({
            datapackDescription: value,
        });
    }

    const onProjectChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        props.updateExportInfo({
            projectName: value,
        });
    }

    const onChangeCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        // current array of providers
        const providers = [...props.exportInfo.providers];
        const propsProviders = props.providers;
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
        props.updateExportInfo({
            providers,
        });

    }

    const deselect = (provider: Eventkit.Provider) => {
        const providers = [...props.exportInfo.providers];
        const propsProviders = props.providers;
        let index;
        index = providers.map(x => x.name).indexOf(provider.name);
        for (const _provider of propsProviders) {
            if (provider.name === provider.name) {
                providers.splice(index, 1);
            }
        }

        // update the state with the new array of options
        props.updateExportInfo({
            providers,
        });
    }

    const onSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        // current array of providers
        let providers = [];
        if (e.target.checked) {
            // set providers to the list of ALL providers
            providers = [...props.providers.filter(provider => provider.display)];
        }

        // update the state with the new array of options
        props.updateExportInfo({
            providers,
        });
    }

    const onSelectProjection = (event) => {
        // Selecting projections for the DataPack, here srid is spatial reference ID
        const selectedSrids = [...props.exportInfo.projections] || [];

        let index;
        // check if the check box is checked or unchecked
        // `target` is the checkbox, and the `name` field is set to the projection srid
        const selectedSrid = Number(event.target.name);
        if (event.target.checked) {
            // add the format to the array
            if (selectedSrids.indexOf(selectedSrid) <= 0) {
                selectedSrids.push(selectedSrid);
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = selectedSrids.indexOf(selectedSrid);
            if (index >= 0) {
                selectedSrids.splice(index, 1);
            }
        }
        // update the state with the new array of options
        props.updateExportInfo({
            projections: selectedSrids,
        });
    }

    const onRefresh = () => {
        // make a copy of providers and set availability to empty json
        props.providers.forEach(provider => props.checkProvider(provider));
    }

    const clearEstimate = (provider: Eventkit.Provider) => {
        const providerInfo = {...props.exportInfo.providerInfo} as Eventkit.Map<Eventkit.Store.ProviderInfo>;
        const updatedProviderInfo = {...providerInfo};

        const providerInfoData = updatedProviderInfo[provider.slug];
        if (!providerInfoData) {
            return; // Error handling, nothing needs to be done
        }

        updatedProviderInfo[provider.slug] = {
            ...providerInfoData,
            estimates: undefined,
        };

        props.updateExportInfo({
            providerInfo: updatedProviderInfo
        });
    }

    const handlePopoverOpen = (e: React.MouseEvent<any>) => {
        setRefreshPopover(e.currentTarget);
    }


    const handlePopoverClose = () => {
        setRefreshPopover(null);
    }

    const joyrideAddSteps = (newSteps: Step[]) => {

        console.log("NEWSTEPS AT BEGINNING:", newSteps)

        // if (!newSteps.length) {
        //     return;
        // }

        return setSteps(steps.concat(newSteps));

        //
        // this.setState((currentState) => {
        //     const nextState = {...currentState};
        //     nextState.steps = nextState.steps.concat(newSteps);
        //     return nextState;
        // });
    }

    const openDrawer = () => {
        // @ts-ignore
        const isOpen: boolean = dataProvider.current.open;
        if (providerDrawerIsOpen == null) {
            setProviderDrawerIsOpen(isOpen);
        }
        if (!isOpen) {
            handleDataProviderExpand();
        }
    }

    const resetDrawer = () => {
        // @ts-ignore
        if (dataProvider.current.open !== providerDrawerIsOpen) {
            handleDataProviderExpand();
        }
        setProviderDrawerIsOpen(null);
    }

    const callback = (data: any) => {
        console.log("DATA IN CALLBACK IS: ", data)
        const {
            action,
            type,
            step,
        } = data;

        props.setNextDisabled();

        if (action === 'start') {
            setDisplayDummy(true);
        }

        if (action === 'close' || action === 'skip' || type === 'tour:end') {
            resetDrawer();
            setIsRunning(false);
            setDisplayDummy(false);
            props.onWalkthroughReset();
            this?.helpers.reset(true);
            window.location.hash = '';
        } else {
            if (data.index === 9 && data.type === 'tooltip') {
                props.setNextEnabled();
            }

            if ((step.target === '.qa-DataProvider-qa-expandTarget' && type === 'step:before') ||
                (step.target === '.qa-DataProvider-ListItem-provFormats' && type === 'step:before')) {
                openDrawer();
            }
        }
        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    }

    const getProviders = () => {
        // During rapid state updates, it is possible that duplicate providers get added to the list.
        // They need to be deduplicated, so that they don't render duplicate elements or cause havoc on the DOM.
        // TODO: Filter based on the providerFilterList state array.
        console.log("PROVIDERS", props.providers);
        let currentProviders = props.providers.filter(provider => (!provider.hidden && provider.display));
        currentProviders = currentProviders.filter(provider => {
            return provider.name.toLowerCase().includes(providerSearch.toLowerCase())
        });
        let filteredSelections = []
        if (providerFilterList.length > 0) {
            console.log("PROVIDER FILTER LIST", providerFilterList)
            providerFilterList.forEach(filter => {
                if (filter.filterType == "type") {
                    filteredSelections = currentProviders.filter(provider => {
                        return provider.data_type == filter.slug
                    });
                }
            });
            currentProviders = filteredSelections;
        }

        // TODO: Add onto the filtering here with additional filters from design.
        currentProviders = [...new Map(currentProviders.map(x => [x.slug, x])).values()];
        if (displayDummy) {
            currentProviders.unshift(dummyProvider as Eventkit.Provider);
        }
        if (providerSortOption) {
            switch (providerSortOption) {
                case "alphabetical-a-z":
                    currentProviders = sortAtoZ(currentProviders);
                    break;
                case "alphabetical-z-a":
                    currentProviders = sortZtoA(currentProviders);
                    break;
                case "newest-first":
                    currentProviders = sortNewestFirst(currentProviders);
                    break;
                case "oldest-first":
                    currentProviders = sortOldestFirst(currentProviders);
            }
        }
        return currentProviders;
    }

    const sortAtoZ = (providers) => {
        providers.sort((a, b) => (a.name - b.name));
        console.log("SORTED PROVIDERS: ", providers)
        return providers;
    }

    const sortZtoA = (providers) => {
        providers.sort((a, b) => (a.name - b.name)).reverse();
        console.log("SORTED PROVIDERS: ", providers)
        return providers;
    }

    const sortNewestFirst = (providers) => {
        providers.sort((a, b) => (a.created_at - b.created_at)).reverse();
        console.log("SORT NEWEST FIRST", providers);
        return providers;
    }

    const sortOldestFirst = (providers) => {
        providers.sort((a, b) => (a.created_at - b.created_at));
        console.log("SORT OLDEST FIRST");
        return providers;
    }

    const projectionHasErrors = (srid: number) => {
        const projectionInfo = incompatibilityInfo.projections[srid];
        if (!!projectionInfo) {
            return projectionInfo.formats.some(format => selectedFormats.indexOf(format.slug) >= 0);
        }
        return false;
    }

    const getProjectionDialog = () => {
        const projectionInfo = incompatibilityInfo.projections[displaySrid];
        const formats = projectionInfo.formats.filter(format => {
            return selectedFormats.indexOf(format.slug) >= 0;
        });
        return (<BaseDialog
            show={projectionCompatibilityOpen}
            title={`Format and Projection Conflict - EPSG:${displaySrid}`}
            onClose={handleProjectionCompatibilityClose}
        >
            <div
                style={{paddingBottom: '10px', wordWrap: 'break-word'}}
                className="qa-ExportInfo-dialog-projection"
            >
                <p><strong>This projection does not support the following format(s):</strong></p>
                <div style={{marginBottom: '10px'}}>
                    {formats.map(format => (
                        <div key={format.slug}>
                            {format.name}
                        </div>
                    ))}
                </div>
            </div>
        </BaseDialog>);
    }

    function onFilterCheckboxChanged(filter) {
        console.log("Checkbox value: ", filter)
        if (providerFilterList.some(item => item.slug == filter.slug)) {
            setProviderFilterList(providerFilterList.filter(item => item.slug !== filter.slug));
        } else {
            setProviderFilterList([...providerFilterList, filter]);
        }
        console.log("CURRENT FILTERS: ", providerFilterList);
    }

    function onSortRadioChanged(sort) {
        setProviderSortOption(sort)
        console.log("SORT OPTION IS ", sort)
    }

    function clearAllFilterSort() {
        setProviderFilterList([]);
        setProviderSortOption("")
    }

    return (
        <div id="root" className={`qa-ExportInfo-root ${classes.root}`}>
            {/*<PermissionsBanner isOpen={true} handleClosedPermissionsBanner={() => {}}/>*/}
            <Step2Validator
                tourRunning={isRunning}
                {...props}
            />

            <EventkitJoyride
                name="Create Page Step 2"
                callback={callback}
                getRef={(_ref) => joyride = _ref}
                steps={steps}
                getHelpers={(helpers: any) => {
                    helpers = helpers
                }}
                continuous
                showSkipButton
                showProgress
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
                                {providerFilterList.map(filter => filter.name)}
                            </div>
                                <div style={{marginBottom: '30px'}}>
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-name ${classes.textField}`}
                                        id="Name"
                                        name="exportName"
                                        setValue={onNameChange}
                                        defaultValue={props.exportInfo.exportName}
                                        placeholder="Datapack Name"
                                        InputProps={{className: classes.input}}
                                        fullWidth
                                        maxLength={100}
                                    />
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-description ${classes.textField}`}
                                        id="Description"
                                        name="datapackDescription"
                                        setValue={onDescriptionChange}
                                        defaultValue={props.exportInfo.datapackDescription}
                                        placeholder="Description"
                                        multiline
                                        inputProps={{style: {fontSize: '16px', lineHeight: '20px'}}}
                                        fullWidth
                                        maxLength={250}
                                        // eslint-disable-next-line react/jsx-no-duplicate-props
                                        InputProps={{className: classes.input, style: {lineHeight: '21px'}}}
                                    />
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-project ${classes.textField}`}
                                        id="Project"
                                        name="projectName"
                                        setValue={onProjectChange}
                                        defaultValue={props.exportInfo.projectName}
                                        placeholder="Project Name"
                                        InputProps={{className: classes.input}}
                                        fullWidth
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                            <div className={classes.heading}>
                                <div
                                    id="layersHeader"
                                    className="qa-ExportInfo-layersHeader"
                                    style={{marginRight: '5px'}}
                                >
                                    Select Data Sources
                                </div>
                                <div
                                    id="layersSubheader"
                                    style={{fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic'}}
                                >
                                    (You must choose <strong>at least one</strong>)
                                </div>
                            </div>

                        <div className={classes.searchFilterContainer}>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setShowProviderSearch(!showProviderSearch)}
                                        onKeyPress={() => setShowProviderSearch(!showProviderSearch)}
                                        className={classes.searchLabel}
                                    > Search
                                    </span>
                            {renderIf(() => (
                                <div>
                                    <TextField
                                        id="searchByName"
                                        name="searchByName"
                                        autoComplete="off"
                                        fullWidth
                                        className={classes.textField}
                                        onChange={e => setProviderSearch(e.target.value)}
                                    />
                                </div>

                            ), showProviderSearch)}
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => setShowProviderFilter(!showProviderFilter)}
                                onKeyPress={() => setShowProviderFilter(!showProviderFilter)}
                                className={classes.filterLabel}
                            >Sort / Filter</span>
                            {renderIf(() => (
                                <div
                                    className={`qa-ExportInfo-filterOptions-container ${classes.filterContainer}`}
                                    style={{display: 'block', marginTop: '8px'}}>
                                    {buildFilters().map((filterType) => (
                                        <div>
                                            <FormGroup>
                                                <FormLabel component="legend">{filterType.name}</FormLabel>
                                                {filterType.options.map((filter) =>
                                                    <div>
                                                        <FormControlLabel
                                                            control={<Checkbox
                                                                className="qa-ExportInfo-CheckBox-filter"
                                                                classes={{
                                                                    root: classes.checkbox,
                                                                    checked: classes.checked
                                                                }}
                                                                onChange={() => onFilterCheckboxChanged(filter)}
                                                            />}
                                                            label={filter.name}
                                                        />
                                                    </div>
                                                )}
                                            </FormGroup>
                                        </div>
                                    ))}
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Sort By</FormLabel>
                                        <RadioGroup>
                                            {buildSortOptions().map((sortOption) => (
                                                <div>
                                                    <div>

                                                        <FormControlLabel
                                                            className="qa-ExportInfo-Radio-sort"
                                                            value={sortOption.slug}
                                                            control={<Radio
                                                                classes={{
                                                                    root: classes.radio,
                                                                }}
                                                            />}
                                                            label={sortOption.name}
                                                            onChange={() => onSortRadioChanged(sortOption.slug)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => clearAllFilterSort()}
                                            onKeyPress={() => clearAllFilterSort()}
                                            className={classes.filterLabel}
                                        >Clear All</span>
                                    </FormControl>
                                </div>
                            ), showProviderFilter)}
                        </div>

                        <div id="select" className={`qa-ExportInfo-selectAll ${classes.selectAll}`}>
                            <Checkbox
                                classes={{root: classes.checkbox, checked: classes.checked}}
                                name="SelectAll"
                                checked={props.exportInfo.providers.length === props.providers.filter(
                                    provider => provider.display).length}
                                onChange={onSelectAll}
                                style={{width: '24px', height: '24px'}}
                            />
                            <span
                                style={{
                                    padding: '0px 15px', display: 'flex',
                                    flexWrap: 'wrap', fontSize: '16px',
                                }}
                            >
                                            Select All
                                            </span>
                        </div>
                        <div className={classes.sectionBottom}>
                            <div className={`qa-ExportInfo-ListHeader ${classes.listHeading}`}>
                                <div
                                    className="qa-ExportInfo-ListHeaderItem"
                                    style={{flex: '1 1 auto'}}
                                >
                                    DATA PROVIDERS
                                </div>
                                <div
                                    className="qa-ExportInfo-ListHeaderItem"
                                    style={{display: 'flex', justifyContent: 'flex-end', position: 'relative'}}
                                >
                                    <span>AVAILABILITY</span>
                                    <NavigationRefresh
                                        className={classes.refreshIcon}
                                        onMouseEnter={handlePopoverOpen}
                                        onMouseLeave={handlePopoverClose}
                                        onClick={onRefresh}
                                        color="primary"
                                    />
                                    <Popover
                                        style={{pointerEvents: 'none'}}
                                        PaperProps={{
                                            style: {padding: '16px'},
                                        }}
                                        open={Boolean(refreshPopover)}
                                        anchorEl={refreshPopover}
                                        onClose={handlePopoverClose}
                                        anchorOrigin={{
                                            vertical: 'top',
                                            horizontal: 'center',
                                        }}
                                        transformOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'center',
                                        }}
                                    >
                                        <div style={{maxWidth: 400}}>
                                            <Typography variant="h6" gutterBottom style={{fontWeight: 600}}>
                                                RUN AVAILABILITY CHECK AGAIN
                                            </Typography>
                                            <div>You may try to resolve errors by running the availability check
                                                again.
                                            </div>
                                        </div>
                                    </Popover>
                                </div>
                            </div>
                            <div>
                                <List
                                    id="ProviderList"
                                    className="qa-ExportInfo-List"
                                    style={{width: '100%', fontSize: '16px'}}
                                >
                                    {getProviders().map((provider, ix) => (
                                        <DataProvider
                                            key={provider.slug + "-DataProviderList"}
                                            geojson={props.geojson}
                                            provider={provider}
                                            onChange={onChangeCheck}
                                            deselect={deselect}
                                            checked={props.exportInfo.providers.map(x => x.name)
                                                .indexOf(provider.name) !== -1}
                                            alt={ix % 2 === 0}
                                            renderEstimate={appContext.SERVE_ESTIMATES}
                                            checkProvider={() => {
                                                // Check the provider for updated info.
                                                props.checkProvider(provider).then(providerInfo => {
                                                    props.updateExportInfo({
                                                        providerInfo: {
                                                            ...props.exportInfo.providerInfo,
                                                            [provider.slug]: providerInfo.data,
                                                        }
                                                    });
                                                    // Trigger an estimate calculation update in the parent
                                                    // Does not re-request any data, calculates the total from available results.
                                                    props.onUpdateEstimate();
                                                });
                                            }}
                                            incompatibilityInfo={incompatibilityInfo}
                                            clearEstimate={clearEstimate}
                                            // Get reference to handle logic for joyride.
                                            {...(() => {
                                                const refProps = {} as any;
                                                if (ix === 0) {
                                                    refProps.getRef = (ref: any) => dataProvider.current = ref;
                                                }
                                                return refProps;
                                            })()}
                                        />
                                    )) || "No Providers Found"}
                                </List>
                            </div>
                            <div className={classes.stickyRow}>
                                <div className={classes.stickyRowItems}
                                     style={{paddingLeft: '5px', paddingTop: '15px'}}>
                                    <AddDataSource/>
                                </div>
                            </div>
                        </div>
                        <div
                            id="projectionHeader"
                            className={`qa-ExportInfo-projectionHeader ${classes.heading}`}
                        >
                            Select Projection
                        </div>
                        <div className={classes.sectionBottom}>
                            <div id="Projections"
                                 className={`qa-ExportInfo-projections ${classes.projections}`}>
                                {projections.map((projection, ix) => (
                                    <div
                                        key={projection.srid}
                                        style={{
                                            display: 'flex',
                                            padding: '16px 10px',
                                            backgroundColor: (ix % 2 === 0) ? colors.secondary : colors.white
                                        }}
                                    >
                                        <Checkbox
                                            className="qa-ExportInfo-CheckBox-projection"
                                            classes={{root: classes.checkbox, checked: classes.checked}}
                                            name={`${projection.srid}`}
                                            checked={props.exportInfo.projections.indexOf(projection.srid) !== -1}
                                            style={{width: '24px', height: '24px'}}
                                            onChange={onSelectProjection}
                                        />
                                        <span style={{padding: '0px 15px', display: 'flex', flexWrap: 'wrap'}}>
                                                EPSG:{projection.srid} - {projection.name}
                                            </span>
                                        {projectionHasErrors(projection.srid) &&
                                        <AlertWarning
                                            className={`qa-Projection-Warning-Icon`}
                                            onClick={() => {
                                                handleProjectionCompatibilityOpen(projection);
                                            }}
                                            style={{
                                                cursor: 'pointer', verticalAlign: 'middle',
                                                marginLeft: '5px', height: '18px', width: '18px',
                                                color: 'rgba(255, 162, 0, 0.87)'
                                            }}
                                        />
                                        }
                                    </div>
                                    ))}
                                    {projectionCompatibilityOpen &&
                                    getProjectionDialog()
                                    }
                                </div>
                            </div>

                            <div id="ShareAll" className={`qa-ExportInfo-ShareHeader ${classes.heading}`}>
                                Share this DataPack
                            </div>
                            <div
                                id="select" className={`qa-ExportInfo-selectAll ${classes.selectAll}`}
                                style={{padding: '0px 10px 10px 8px'}}
                            >
                                <Checkbox
                                    classes={{root: classes.checkbox, checked: classes.checked}}
                                    name="ShareAll"
                                    checked={props.exportInfo.visibility === 'PUBLIC'}
                                    onChange={checkShareAll}
                                    style={{width: '24px', height: '24px'}}
                                />
                                <span
                                    style={{
                                        padding: '0px 15px', display: 'flex',
                                        flexWrap: 'wrap', fontSize: '16px',
                                    }}
                                >
                                    Share with all EventKit users
                                </span>
                            </div>
                            <div id="aoiHeader" className={`qa-ExportInfo-AoiHeader ${classes.heading}`}>
                                Area of Interest (AOI)
                            </div>
                            <div className={classes.sectionBottom}>
                                <CustomTableRow
                                    className="qa-ExportInfo-area"
                                    title="Area"
                                    containerStyle={{fontSize: '16px'}}
                                >
                                    {props.exportInfo.areaStr}
                                </CustomTableRow>
                                <div style={{padding: '15px 0px 20px'}}>
                                    <MapCard geojson={props.geojson}>
                                        <span style={{marginRight: '10px'}}>Selected Area of Interest</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={props.handlePrev}
                                            onKeyPress={props.handlePrev}
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

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportInfo: state.exportInfo,
        providers: state.providers,
        nextEnabled: state.stepperNextEnabled,
        projections: [...state.projections],
        formats: [...state.formats],
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

function AddDataSource() {
    const [requestDataSourceOpen, setRequestDataSourceOpen] = useState(false);

    return (
        <>
            <RequestDataSource open={requestDataSourceOpen}
                               onClose={() => setRequestDataSourceOpen(false)}/>
            <Link onClick={() => setRequestDataSourceOpen(true)} style={{cursor: 'pointer'}}>
                Request New Data Source
            </Link>
        </>
    );
}

// TODO: Remove this function and debounce inline.
// Wrapper around the CustomTextField component that debounces the redux store call.
// This was done to avoid refactoring the entire component to hooks all at once.
// At a later point this could be removed and done in place.
function DebouncedTextField(props: any) {
    const {setValue, ...passThroughProps} = props;
    const [value, debounceValue] = useDebouncedState(props.defaultValue, 500);
    useEffect(() => {
        props.setValue(value);
    }, [value]);
    return (
        <CustomTextField
            onChange={e => debounceValue(e.target.value)}
            {...passThroughProps}
            className={`debounced-textField ${props.className ? props.className : ''}`}
        />
    )
}

export default withTheme(withStyles(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportInfo)));
