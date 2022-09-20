import * as React from "react";
import Collapsible from "react-collapsible";
import { useCallback, useEffect, useRef, useState } from "react";
import { createStyles, Theme, withStyles, withTheme } from "@material-ui/core/styles";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Step } from "react-joyride";
import { Virtuoso } from "react-virtuoso";
import Paper from "@material-ui/core/Paper";
import Popover from "@material-ui/core/Popover";
import Checkbox from "@material-ui/core/Checkbox";
import Typography from "@material-ui/core/Typography";
import NavigationRefresh from "@material-ui/icons/Refresh";
import { getSqKmString } from "../../utils/generic";
import CustomScrollbar from "../common/CustomScrollbar";
import DataProvider from "./DataProvider";
import MapCard from "../common/MapCard";
import { updateExportInfo } from "../../actions/datacartActions";
import { getProviders } from "../../actions/providerActions";
import { stepperNextDisabled, stepperNextEnabled } from "../../actions/uiActions";
import CustomTextField from "../common/CustomTextField";
import CustomTableRow from "../common/CustomTableRow";
import BaseDialog from "../Dialog/BaseDialog";
import AlertWarning from "@material-ui/icons/Warning";
import { useDebouncedState } from "../../utils/hooks/hooks";
import RequestDataSource from "./RequestDataSource";
import {
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    InputAdornment,
    Link,
    Radio,
    RadioGroup,
    TextField
} from "@material-ui/core";
import EventkitJoyride from "../common/JoyrideWrapper";
import { Step2Validator } from "./ExportValidation";
import { useAppContext } from "../ApplicationContext";
import { renderIf } from "../../utils/renderIf";
import Button from "@material-ui/core/Button";
import unionBy from "lodash/unionBy";
import { joyride } from "../../joyride.config";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

const jss = (theme: Eventkit.Theme & Theme) =>
    createStyles({
        underlineStyle: {
            width: "calc(100% - 10px)",
            left: "5px"
        },
        window: {
            height: "calc(100vh - 180px)"
        },
        root: {
            width: "100%",
            height: "calc(100vh - 180px)",
            backgroundImage: `url(${theme.eventkit.images.topo_light})`,
            backgroundRepeat: "repeat repeat",
            justifyContent: "space-around",
            display: "flex",
            flexWrap: "wrap"
        },
        form: {
            margin: "0 auto",
            width: "90%",
            height: "calc(100vh - 180px)"
        },
        paper: {
            margin: "0px auto",
            padding: "20px",
            marginTop: "30px",
            marginBottom: "30px",
            width: "100%",
            maxWidth: "700px"
        },
        sortFilterContainer: {
            alignItems: "stretch",
            padding: "5px 0px 15px"
        },
        filterDropdownContainer: {
            display: "flex",
            justifyContent: "left",
            flexWrap: "wrap"
        },
        filterLabel: {
            fontSize: "15px",
            fontWeight: "bold",
            verticalAlign: "top",
            cursor: "pointer",
            color: theme.eventkit.colors.primary,
            border: "1px solid black",
            boxSizing: "border-box",
            overflow: "hidden",
            padding: "0.3em 0.75em",
            borderRadius: "4px"
        },
        expandIcon: {
            verticalAlign: "bottom"
        },
        filterLabelDropdown: {
            fontSize: "15px",
            fontWeight: "bold",
            cursor: "pointer",
            color: theme.eventkit.colors.primary,
            float: "right",
            backgroundColor: "#F9F9F9",
            border: "1px solid black",
            borderBottom: "none",
            boxSizing: "border-box",
            overflow: "hidden",
            padding: "0.3em 0.75em",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            marginBottom: "-1px"
        },
        filterContainer: {
            display: "block",
            flexWrap: "wrap",
            width: "100%",
            zIndex: 1,
            border: "1px solid black",
            backgroundColor: "#F9F9F9",
            padding: "20px",
            borderRadius: "4px",
            borderTopLeftRadius: "0"
        },
        heading: {
            fontSize: "18px",
            fontWeight: "bold",
            paddingBottom: "10px",
            display: "flex",
            flexWrap: "wrap",
            lineHeight: "25px"
        },
        textField: {
            marginTop: "15px",
            backgroundColor: theme.eventkit.colors.secondary
        },
        filterTextField: {
            backgroundColor: theme.eventkit.colors.secondary,
            marginBottom: "10px"
        },
        input: {
            fontSize: "16px",
            paddingLeft: "5px",
            paddingRight: "50px"
        },
        listHeading: {
            fontSize: "16px",
            fontWeight: 300,
            display: "flex",
            padding: "0px 10px"
        },
        refreshIcon: {
            height: "22px",
            marginLeft: "5px",
            cursor: "pointer",
            verticalAlign: "bottom"
        },
        sectionBottom: {
            paddingBottom: "30px"
        },
        projections: {
            display: "block",
            lineHeight: "24px"
        },
        selectAll: {
            padding: "0px 10px 10px 16px",
            display: "flex",
            lineHeight: "24px"
        },
        infoIcon: {
            height: "24px",
            width: "24px",
            cursor: "pointer"
        },
        editAoi: {
            fontSize: "15px",
            fontWeight: "normal",
            verticalAlign: "top",
            cursor: "pointer",
            color: theme.eventkit.colors.primary
        },
        checkbox: {
            height: "24px",
            flex: "0 0 auto",
            color: theme.eventkit.colors.primary,
            "&$checked": {
                color: theme.eventkit.colors.success
            }
        },
        checkboxLabel: {
            fontSize: "14px"
        },
        radio: {
            fontSize: "1em",
            height: "24px",
            flex: "0 0 auto",
            color: theme.eventkit.colors.primary,
            "&$checked": {
                color: theme.eventkit.colors.success
            }
        },
        radioLabel: {
            fontSize: "14px"
        },
        checked: {},
        stickyRow: {
            height: "50px",
            display: "flex"
        },
        stickyRowItems: {
            flexGrow: 1
        },
        clearAllButton: {
            fontSize: "15px",
            fontWeight: "normal",
            cursor: "pointer",
            color: theme.eventkit.colors.primary
            // float: 'left',
        },
        containerGrid: {
            marginTop: "10px"
        },
        formControlLabelContainer: {
            padding: "5px",
            paddingLeft: "10px"
        },
        searchFieldClear: {
            cursor: "pointer",
            padding: "1em",
            "& .MuiTypography-colorTextSecondary": {
                color: theme.eventkit.colors.primary
            }
        },
        filterChip: {
            height: "26px",
            fontSize: "14px",
            border: "1px solid rgba(0, 0, 0, 0.5)",
            backgroundColor: theme.eventkit.colors.white,
            marginRight: "3px"
        },
        filterLabelDropdownChip: {
            backgroundColor: "#F9F9F9",
            border: "1px solid black",
            padding: "0.3em 0.75em",
            borderRadius: "4px",
            borderTopLeftRadius: "0",
            marginTop: "0px"
        },
        collapsible: {
            backgroundColor: theme.eventkit.colors.primary_background,
            marginBottom: 10
        },
        collapseOuterContent: {
            transition: "height 200ms linear 0s"
        },
        collapseInnerContent: {
            backgroundColor: theme.eventkit.colors.secondary,
            padding: "3px"
        },
        collapsibleTriggerTitle: {
            display: "block",
            fontWeight: 400,
            textDecoration: "none",
            padding: 5,
            color: theme.eventkit.colors.black
        },
        collapseIcon: {
            float: "right",
            color: theme.eventkit.colors.black
        },
        lineBreak: {
            marginTop: "0px",
            marginBottom: "10px",
            borderTop: `1px solid ${theme.eventkit.colors.grey}`
        },
        legendLabel: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "5px",
            borderBottom: 0,
            color: theme.eventkit.colors.black
        }
    });

// Use this to keep track of incompatibilities in the user selected DataPack options
export interface IncompatibilityInfo {
    formats: {
        [slug: string]: {
            projections: number[]; // Map format slugs to the projection SRID's that it is NOT compatible with.
        };
    };
    projections: {
        [srid: number]: {
            formats: Eventkit.Format[]; // Map projection SRID's to the format it is NOT compatible with.
        };
    };
}

export interface Props {
    handlePrev: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    onUpdateEstimate?: () => void;
    checkProvider: any;
}

export interface State {
    steps: Step[];
    isRunning: boolean;
    providers: Eventkit.Provider[];
    topics: Eventkit.Topic[];
    fetchingProviders: boolean;
    displayDummy: boolean;
    refreshPopover: null | HTMLElement;
    projectionCompatibilityOpen: boolean;
    displaySrid: number; // Which projection is shown in the compatibility warning box
    selectedFormats: string[];
    incompatibilityInfo: IncompatibilityInfo;
    providerDrawerIsOpen: boolean;
    stepIndex: number;
}

const dummyProvider = {
    uid: "notreal",
    slug: "slug",
    name: "Example Map Service",
    max_selection: "10000",
    type: "wmts",
    service_description: "This is an example service used for demonstration purposes",
    license: {
        text: "test license text",
        name: "test license"
    },
    level_from: 0,
    level_to: 13,
    supported_formats: [
        {
            uid: "fakeduid",
            url: "http://host.docker.internal/api/formats/gpkg",
            slug: "gpkg",
            name: "Geopackage",
            description: "GeoPackage",
            supported_projections: [{ srid: 4326, name: "", description: "" }]
        } as Eventkit.Format
    ]
} as Eventkit.Provider;

export function ExportInfo(props: Props) {
    const geojson = useSelector((store: any) => store.aoiInfo.geojson);
    const exportInfo = useSelector((store: any) => store.exportInfo);
    const providers: Eventkit.Provider[] = useSelector((store: any) => store.providers.objects);
    const fetchingProviders: boolean = useSelector((store: any) => store.providers.fetching);
    const projections: Eventkit.Projection[] = useSelector((store: any) => [...store.projections]);
    const topics: Eventkit.Topic[] = useSelector((store: any) => [...store.topics]);
    const formats: Eventkit.Format[] = useSelector((store: any) => [...store.formats]);
    const [steps, setSteps] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [providerSearch, setProviderSearch] = useState("");
    const [isFilteringByProviderGeometry, setIsFilteringByProviderGeometry] = useState(true);
    const [isFilteringByFavorites, setIsFilteringByFavorites] = useState(false);
    const [showProviderFilter, setShowProviderFilter] = useState(false);
    const [showTypeFilter, setShowTypeFilter] = useState(false);
    const [showTopicFilter, setShowTopicFilter] = useState(false);
    const [providerFilterList, setProviderFilterList] = useState([]);
    const [providerSortOption, setProviderSortOption] = useState("");
    const [selectedTopics, setSelectedTopicsList] = useState([]);
    const [refreshPopover, setRefreshPopover] = useState(null);
    const [projectionCompatibilityOpen, setProjectionCompatibilityOpen] = useState(false);
    const [displaySrid, setDisplaySrid] = useState(null);
    const [selectedFormats, setSelectedFormats] = useState([]);
    const [orderedProjections, setOrderedProjections] = useState(projections);
    const [incompatibilityInfo, setIncompatibilityInfo] = useState({
        formats: {},
        projections: {}
    } as IncompatibilityInfo);
    const [providerDrawerIsOpen, setProviderDrawerIsOpen] = useState(false);
    const [displayDummy, setDisplayDummy] = useState(false);

    useEffect(() => {
        updateSelectedFormats();
    }, [selectedFormats]);
    useEffect(() => {
        setIncompatibilityInfo(checkCompatibility());
    }, [exportInfo.projections]);

    const dispatch = useDispatch();
    // Call this anytime we need to update providers, instead of setProviders.
    const updateExportInfoCallback = useCallback(
        (updatedExportInfo) => dispatch(updateExportInfo(updatedExportInfo)),
        []
    );
    const setNextDisabled = useCallback(() => dispatch(stepperNextDisabled()), []);

    const setNextEnabled = useCallback(() => dispatch(stepperNextEnabled()), []);

    const appContext = useAppContext();
    const { colors } = props.theme.eventkit;
    const { classes } = props;

    let joyrideRef = useRef(joyride);
    const dataProvider = useRef(null);
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Component mount and unmount
    useEffect(() => {
        // calculate the area of the AOI
        const areaStr = getSqKmString(geojson);
        const updatedInfo = {
            areaStr,
            visibility: this?.context?.config?.DATAPACKS_DEFAULT_SHARED ? "PUBLIC" : "PRIVATE"
        } as Eventkit.Store.ExportInfo;
        const steps = joyride.ExportInfo as any[];
        joyrideAddSteps(steps);

        if (projections.find((projection) => projection.srid === 4326)) {
            if (exportInfo.projections && exportInfo.projections.length === 0) {
                updatedInfo.projections = [4326];
            }
        }
        // Move EPSG:4326 (if present -- it should always be) to the front so it displays first.
        const indexOf4326 = projections.map((projection) => projection.srid).indexOf(4326);
        if (indexOf4326 >= 1) {
            setOrderedProjections([projections.splice(indexOf4326, 1)[0], ...projections]);
        }

        updateExportInfoCallback(updatedInfo);

        return () => {
            source.cancel("Exiting Page.");
        };
    }, []);

    useEffect(() => {
        if (props.walkthroughClicked && !isRunning) {
            joyrideRef?.current?.reset(true);
            setIsRunning(true);
        }
    }, [props.walkthroughClicked]);

    useEffect(() => {
        updateProviders();
    }, [selectedTopics, isFilteringByProviderGeometry]);

    const [filterOptions, setFilterOptions] = useState([
        {
            name: "Type(s)",
            filterType: "type",
            options: [
                {
                    name: "Raster",
                    filterType: "type",
                    slug: "raster",
                    isChecked: false
                },
                {
                    name: "Vector",
                    filterType: "type",
                    slug: "vector",
                    isChecked: false
                },
                {
                    name: "Elevation",
                    filterType: "type",
                    slug: "elevation",
                    isChecked: false
                },
                {
                    name: "Mesh",
                    filterType: "type",
                    slug: "mesh",
                    isChecked: false
                },
                {
                    name: "Point Cloud",
                    filterType: "type",
                    slug: "point_cloud",
                    isChecked: false
                }
            ]
        }
    ]);

    const [sortOptions, setSortOptions] = useState([
        {
            name: "Favorites",
            slug: "favorites",
            isChecked: false
        },
        {
            name: "Alphabetical A-Z",
            slug: "alphabetical-a-z",
            isChecked: false
        },
        {
            name: "Alphabetical Z-A",
            slug: "alphabetical-z-a",
            isChecked: false
        },
        {
            name: `Most Downloaded (${appContext.DATA_PROVIDER_WINDOW} days)`,
            slug: "most-downloaded",
            isChecked: false
        },
        {
            name: `Recently Downloaded (${appContext.DATA_PROVIDER_WINDOW} days)`,
            slug: "most-recent",
            isChecked: false
        }
    ]);

    const checkCompatibility = () => {
        const selectedProjections = exportInfo.projections;

        const formatMap = {};
        const projectionMap = {};
        formats.forEach((format) => {
            const formatSupportedProjections = format.supported_projections.map((projection) => projection.srid);
            selectedProjections.forEach((selectedProjection) => {
                if (!formatMap[format.slug]) {
                    formatMap[format.slug] = { projections: [] };
                }
                if (!projectionMap[selectedProjection]) {
                    projectionMap[selectedProjection] = { formats: [] };
                }
                if (!formatSupportedProjections.includes(selectedProjection)) {
                    projectionMap[selectedProjection].formats.push(format);
                    formatMap[format.slug].projections.push(selectedProjection);
                }
            });
        });
        return { ...incompatibilityInfo, formats: formatMap, projections: projectionMap };
    };

    const checkShareAll = () => {
        if (exportInfo.visibility === "PRIVATE") {
            updateExportInfoCallback({
                visibility: "PUBLIC"
            });
            return;
        }
        updateExportInfoCallback({
            visibility: "PRIVATE"
        });
    };

    const getExpandIcon = () => {
        return (
            <span style={{ margin: "auto" }}>
                {renderIf(
                    () => (
                        <ExpandLess
                            id="ExpandButton"
                            className={classes.expandIcon}
                            onClick={() => setShowProviderFilter(!showProviderFilter)}
                            color="primary"
                        />
                    ),
                    !!showProviderFilter
                )}
                {renderIf(
                    () => (
                        <ExpandMore
                            id="ExpandButton"
                            className={classes.expandIcon}
                            onClick={() => setShowProviderFilter(!showProviderFilter)}
                            color="primary"
                        />
                    ),
                    !showProviderFilter
                )}
            </span>
        );
    };

    const collapseTriggerContent = (title: string, showCondition: boolean) => {
        return (
            <span className={classes.collapsibleTriggerTitle}>
                {title}
                <span style={{ margin: "auto" }}>
                    {renderIf(
                        () => (
                            <ExpandLess id="ExpandButton" className={classes.collapseIcon} color="primary" />
                        ),
                        !!showCondition
                    )}
                    {renderIf(
                        () => (
                            <ExpandMore id="ExpandButton" className={classes.collapseIcon} color="primary" />
                        ),
                        !showCondition
                    )}
                </span>
            </span>
        );
    };

    const updateSelectedFormats = () => {
        // exportInfo.providers is the list of selected providers, i.e. what will be included in the DataPack.
        // props.providers is the list of available providers.
        const exportOptions = exportInfo.exportOptions;
        const selectedProviders = [...exportInfo.providers];

        const selectedFormats = [] as string[];
        selectedProviders.forEach((provider) => {
            const providerOptions = exportOptions[provider.slug];
            if (providerOptions && !!providerOptions.formats) {
                providerOptions.formats.forEach((formatSlug) => {
                    if (selectedFormats.indexOf(formatSlug) < 0) {
                        selectedFormats.push(formatSlug);
                    }
                });
            }
        });
        updateExportInfoCallback({ formats: selectedFormats });
    };

    const handleProjectionCompatibilityOpen = (projection: Eventkit.Projection) => {
        setDisplaySrid(projection.srid);
        setProjectionCompatibilityOpen(true);
    };

    const handleProjectionCompatibilityClose = () => {
        setProjectionCompatibilityOpen(false);
    };

    const handleDataProviderExpand = () => {
        dataProvider.current.handleExpand();
    };

    const onNameChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        updateExportInfoCallback({
            exportName: value
        });
    };

    const onDescriptionChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        updateExportInfoCallback({
            datapackDescription: value
        });
    };

    const onProjectChange = (value) => {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        updateExportInfoCallback({
            projectName: value
        });
    };

    const onChangeCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        // current array of providers
        const selectedProviders = [...exportInfo.providers];
        let index;
        // check if the check box is checked or unchecked
        if (e.target.checked) {
            // add the provider to the array
            for (const provider of providers) {
                if (provider.name === e.target.name) {
                    selectedProviders.push(provider);
                    break;
                }
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = selectedProviders.map((x) => x.name).indexOf(e.target.name);
            selectedProviders.splice(index, 1);
        }
        // update the state with the new array of options
        updateExportInfoCallback({
            providers: selectedProviders
        });
    };

    const deselect = (provider: Eventkit.Provider) => {
        const selectedProviders = [...exportInfo.providers];
        let index;
        index = selectedProviders.map((x) => x.name).indexOf(provider.name);
        for (const _provider of providers) {
            if (provider.name === provider.name) {
                selectedProviders.splice(index, 1);
            }
        }

        // update the state with the new array of options
        updateExportInfoCallback({
            providers: selectedProviders
        });
    };

    const onSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        // current array of providers
        let selectedProviders = [];
        if (e.target.checked) {
            // set providers to the list of visible providers
            selectedProviders = [...getCurrentProviders().filter((provider) => provider.display)];
        }

        // update the state with the new array of options
        updateExportInfoCallback({
            providers: selectedProviders
        });
    };

    const onSelectTopic = (event) => {
        const newSelectedTopics = [...selectedTopics] || [];
        let index;
        // check if the check box is checked or unchecked
        // `target` is the checkbox, and the `name` field is set to the topic slug
        const selectedTopic = event.target.name;
        if (event.target.checked) {
            if (newSelectedTopics.indexOf(selectedTopic) < 0) {
                newSelectedTopics.push(selectedTopic);
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = newSelectedTopics.indexOf(selectedTopic);
            if (index >= 0) {
                newSelectedTopics.splice(index, 1);
            }
        }

        setSelectedTopicsList(newSelectedTopics);
    };

    const onSelectProjection = (event) => {
        // Selecting projections for the DataPack, here srid is spatial reference ID
        const selectedSrids = [...exportInfo.projections] || [];

        let index;
        // check if the check box is checked or unchecked
        // `target` is the checkbox, and the `name` field is set to the projection srid
        const selectedSrid = Number(event.target.name);
        if (event.target.checked) {
            // add the format to the array
            if (selectedSrids.indexOf(selectedSrid) < 0) {
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
        updateExportInfoCallback({
            projections: selectedSrids
        });
    };

    const onRefresh = () => {
        // make a copy of providers and set availability to empty json
        providers.forEach((provider) => props.checkProvider(provider));
    };

    const clearEstimate = (provider: Eventkit.Provider) => {
        const providerInfo = { ...exportInfo.providerInfo } as Eventkit.Map<Eventkit.Store.ProviderInfo>;
        const updatedProviderInfo = { ...providerInfo };

        const providerInfoData = updatedProviderInfo[provider.slug];
        if (!providerInfoData) {
            return; // Error handling, nothing needs to be done
        }

        updatedProviderInfo[provider.slug] = {
            ...providerInfoData,
            estimates: undefined
        };

        updateExportInfoCallback({
            providerInfo: updatedProviderInfo
        });
    };

    const handlePopoverOpen = (e: React.MouseEvent<any>) => {
        setRefreshPopover(e.currentTarget);
    };

    const handlePopoverClose = () => {
        setRefreshPopover(null);
    };

    const joyrideAddSteps = (newSteps: Step[]) => {
        return setSteps(steps.concat(newSteps));
    };

    const openDrawer = () => {
        const isOpen: boolean = dataProvider.current.open;
        if (providerDrawerIsOpen == null) {
            setProviderDrawerIsOpen(isOpen);
        }
        if (!isOpen) {
            handleDataProviderExpand();
        }
    };

    const resetDrawer = () => {
        if (dataProvider.current.open !== providerDrawerIsOpen) {
            handleDataProviderExpand();
        }
        setProviderDrawerIsOpen(null);
    };

    const callback = (data: any) => {
        const { action, type, step } = data;

        setNextDisabled();

        if (action === "start") {
            setDisplayDummy(true);
        }

        if (action === "close" || action === "skip" || type === "tour:end") {
            resetDrawer();
            setIsRunning(false);
            setDisplayDummy(false);
            props.onWalkthroughReset();
            this?.helpers.reset(true);
            window.location.hash = "";
        } else {
            if (data.index === 9 && data.type === "tooltip") {
                setNextEnabled();
            }

            if (
                (step.target === ".qa-DataProvider-qa-expandTarget" && type === "step:before") ||
                (step.target === ".qa-DataProvider-ListItem-provFormats" && type === "step:before")
            ) {
                openDrawer();
            }
        }
        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    };

    const filterProviders = (currentProviders) => {
        currentProviders = currentProviders.filter((provider) => {
            return provider.name.toLowerCase().includes(providerSearch.toLowerCase());
        });
        let filteredProviders = [];
        if (providerFilterList.length > 0) {
            providerFilterList.forEach((filter) => {
                if (filter.filterType === "type") {
                    filteredProviders = filteredProviders.concat(
                        currentProviders.filter((provider) => {
                            return provider.data_type === filter.slug;
                        })
                    );
                }
            });
            currentProviders = filteredProviders;
        }

        if (isFilteringByFavorites) {
            currentProviders = currentProviders.filter((provider) => provider.favorite === true);
        }

        return currentProviders;
    };

    const sortProviders = (currentProviders) => {
        let sortedProviders: Eventkit.Provider[];
        switch (providerSortOption) {
            case "alphabetical-a-z":
                sortedProviders = sortProvidersAtoZ(currentProviders);
                break;
            case "alphabetical-z-a":
                sortedProviders = sortProvidersZtoA(currentProviders);
                break;
            case "most-downloaded":
                sortedProviders = sortMostDownloaded(currentProviders);
                break;
            case "most-recent":
                sortedProviders = sortMostRecent(currentProviders);
                break;
            case "favorites":
                sortedProviders = sortByFavorites(currentProviders);
                break;
            default:
                sortedProviders = sortProvidersAtoZ(currentProviders);
                break;
        }

        return sortedProviders;
    };

    const sortProvidersAtoZ = (currentProviders: Eventkit.Provider[]) => {
        return currentProviders.sort((a, b) => a.name.localeCompare(b.name));
    };

    const sortProvidersZtoA = (currentProviders: Eventkit.Provider[]) => {
        return currentProviders.sort((a, b) => a.name.localeCompare(b.name)).reverse();
    };

    const sortMostDownloaded = (currentProviders: Eventkit.Provider[]) => {
        return currentProviders.sort((a, b) => b.download_count - a.download_count);
    };

    const sortMostRecent = (currentProviders: Eventkit.Provider[]) => {
        return currentProviders.sort(sortByDate());
    };

    /** This function sorts DataProviders by date ascending,
     * where date is in weeks from most recent to oldest */
    function sortByDate() {
        return function (a: Eventkit.Provider, b: Eventkit.Provider) {
            // equal items sort equally
            if (a.latest_download === b.latest_download) {
                return 0;
            }

            // nulls sort after anything else
            if (a.latest_download === null) {
                return 1;
            }
            if (b.latest_download === null) {
                return -1;
            }

            // Most recent date sorts first
            return a.latest_download < b.latest_download ? -1 : 1;
        };
    }

    const sortByFavorites = (currentProviders) => {
        const favoriteProviders = currentProviders.filter((v) => v.favorite === true);
        const returnProviders = currentProviders;
        if (favoriteProviders.length > 0 && returnProviders) {
            favoriteProviders.forEach((f) =>
                returnProviders.splice(
                    returnProviders.findIndex((value) => f.slug === value.slug),
                    1
                )
            );
            returnProviders.unshift(...favoriteProviders);
        }
        return returnProviders;
    };

    const getCurrentProviders = () => {
        let currentProviders = providers.filter((provider) => !provider.hidden && provider.display);
        currentProviders = filterProviders(currentProviders);

        // Merge the filtered results and currently selected providers for display.
        currentProviders = unionBy(exportInfo.providers, currentProviders, "id");

        currentProviders = sortProviders(currentProviders);

        return currentProviders;
    };

    const dataProviders =
        getCurrentProviders().map((provider, ix) => (
            <DataProvider
                key={provider.slug + "-DataProviderList"}
                geojson={geojson}
                provider={provider}
                onChange={onChangeCheck}
                deselect={deselect}
                checked={exportInfo.providers.map((x) => x.name).indexOf(provider.name) !== -1}
                alt={ix % 2 === 0}
                renderEstimate={appContext.SERVE_ESTIMATES}
                checkProvider={(args) => {
                    const { slug, favorite } = args;
                    // This undefined check is deliberate, want to be sure this code is executed when called
                    // for favorite update.
                    if (slug && favorite != undefined) {
                        if (exportInfo.providers) {
                            exportInfo.providers.forEach((p) => {
                                if (p.slug === slug) {
                                    p.favorite = favorite;
                                }
                            });
                            updateExportInfoCallback({
                                providers: exportInfo.providers
                            });
                        }
                    } else {
                        // Check the provider for updated info.
                        props.checkProvider(provider).then((providerInfo) => {
                            updateExportInfoCallback({
                                providerInfo: {
                                    ...exportInfo.providerInfo,
                                    [provider.slug]: providerInfo.data
                                }
                            });
                            // Trigger an estimate calculation update in the parent
                            // Does not re-request any data, calculates the total from available results.
                            props.onUpdateEstimate();
                        });
                    }
                }}
                incompatibilityInfo={incompatibilityInfo}
                clearEstimate={clearEstimate}
                // Get reference to handle logic for joyride.
                {...(() => {
                    const refProps = {} as any;
                    if (ix === 0) {
                        refProps.getRef = (ref: any) => (dataProvider.current = ref);
                    }
                    return refProps;
                })()}
            />
        )) || [];

    const projectionHasErrors = (srid: number) => {
        const projectionInfo = incompatibilityInfo.projections[srid];
        if (!!projectionInfo) {
            return projectionInfo.formats.some((format) => selectedFormats.indexOf(format.slug) >= 0);
        }
        return false;
    };

    const getProjectionDialog = () => {
        const projectionInfo = incompatibilityInfo.projections[displaySrid];
        const formats = projectionInfo.formats.filter((format) => {
            return selectedFormats.indexOf(format.slug) >= 0;
        });
        return (
            <BaseDialog
                show={projectionCompatibilityOpen}
                title={`Format and Projection Conflict - EPSG:${displaySrid}`}
                onClose={handleProjectionCompatibilityClose}
            >
                <div
                    style={{ paddingBottom: "10px", wordWrap: "break-word" }}
                    className="qa-ExportInfo-dialog-projection"
                >
                    <p>
                        <strong>This projection does not support the following format(s):</strong>
                    </p>
                    <div style={{ marginBottom: "10px" }}>
                        {formats.map((format) => (
                            <div key={format.slug}>{format.name}</div>
                        ))}
                    </div>
                </div>
            </BaseDialog>
        );
    };

    const onFilterCheckboxChanged = (filter) => {
        if (providerFilterList.some((item) => item.slug == filter.slug)) {
            removeProviderFilter(filter);
        } else {
            addProviderFilter(filter);
        }
    };

    const onSortRadioChanged = (sort) => {
        let newSortOptions = [...sortOptions];
        newSortOptions.map((item) => {
            item.isChecked = item.slug == sort;
        });
        setSortOptions(newSortOptions);

        setProviderSortOption(sort);
    };

    const addProviderFilter = (filter) => {
        let newFilterOptions = [...filterOptions];
        let typeIndex = newFilterOptions.map((item) => item.filterType).indexOf(filter.filterType);
        let index = newFilterOptions[typeIndex].options.map((item) => item.slug).indexOf(filter.slug);

        newFilterOptions[0].options[index].isChecked = true;
        setFilterOptions(newFilterOptions);
        setProviderFilterList([...providerFilterList, filter]);
    };

    const removeProviderFilter = (filter) => {
        let newFilterOptions = [...filterOptions];
        let typeIndex = newFilterOptions.map((item) => item.filterType).indexOf(filter.filterType);
        let optionIndex = newFilterOptions[typeIndex].options.map((item) => item.slug).indexOf(filter.slug);

        newFilterOptions[0].options[optionIndex].isChecked = false;
        setFilterOptions(newFilterOptions);
        setProviderFilterList(providerFilterList.filter((item) => item.slug !== filter.slug));
    };

    const clearFilterOptions = () => {
        let newFilterOptions = [...filterOptions];
        newFilterOptions.map((filterType) => filterType.options.map((filter) => (filter.isChecked = false)));
        setFilterOptions(newFilterOptions);
    };

    const clearSortOptions = () => {
        let newSortOptions = [...sortOptions];
        newSortOptions.map((sortOption) => (sortOption.isChecked = false));
    };

    const clearAllFilterSort = () => {
        setProviderFilterList([]);
        setProviderSortOption("");
        setProviderSearch("");
        setSelectedTopicsList([]);
        setIsFilteringByProviderGeometry(true);
        setIsFilteringByFavorites(false);
        clearFilterOptions();
        clearSortOptions();
    };

    const clearAndCloseSortFilter = () => {
        clearAllFilterSort();
        setShowProviderFilter(!showProviderFilter);
    };

    const onProviderGeometryFilterCheckboxChanged = () => {
        // Have to use a local variable because the state is not updated quickly enough.
        let newIsFilteringByProviderGeometry = !isFilteringByProviderGeometry;
        setIsFilteringByProviderGeometry(newIsFilteringByProviderGeometry);
    };

    const onFilterFavoritesChanged = () => {
        // Have to use a local variable because the state is not updated quickly enough.
        let newFilterFavorites = !isFilteringByFavorites;
        setIsFilteringByFavorites(newFilterFavorites);
    };

    const updateProviders = () => {
        const geo = isFilteringByProviderGeometry ? geojson : null;
        const filterTopics = selectedTopics.length > 0 ? selectedTopics : null;
        dispatch(getProviders(geo, filterTopics));
    };

    return (
        <div id="root" className={`qa-ExportInfo-root ${classes.root}`}>
            {/*<PermissionsBanner isOpen={true} handleClosedPermissionsBanner={() => {}}/>*/}
            <Step2Validator tourRunning={isRunning} {...props} />

            <EventkitJoyride
                name="Create Page Step 2"
                callback={callback}
                getRef={(_ref) => (joyrideRef = _ref)}
                steps={steps}
                getHelpers={(helpers: any) => {
                    helpers = helpers;
                }}
                continuous
                showSkipButton
                showProgress
                locale={{
                    back: (<span>Back</span>) as any,
                    close: (<span>Close</span>) as any,
                    last: (<span>Done</span>) as any,
                    next: (<span>Next</span>) as any,
                    skip: (<span>Skip</span>) as any
                }}
                run={isRunning}
            />
            <CustomScrollbar>
                <form id="form" className={`qa-ExportInfo-form ${classes.form}`}>
                    <Paper id="paper" className={`qa-ExportInfo-Paper ${classes.paper}`} elevation={2}>
                        <div className="qa-ExportInfo-general-info" id="GeneralInfo">
                            <div id="mainHeading" className={`qa-ExportInfo-mainHeading ${classes.heading}`}>
                                Enter General Information
                            </div>
                            <div style={{ marginBottom: "30px" }}>
                                <DebouncedTextField
                                    className={`qa-ExportInfo-input-name ${classes.textField}`}
                                    id="Name"
                                    name="exportName"
                                    setValue={onNameChange}
                                    defaultValue={exportInfo.exportName}
                                    placeholder="Datapack Name"
                                    InputProps={{ className: classes.input }}
                                    fullWidth
                                    maxLength={100}
                                />
                                <DebouncedTextField
                                    className={`qa-ExportInfo-input-description ${classes.textField}`}
                                    id="Description"
                                    name="datapackDescription"
                                    setValue={onDescriptionChange}
                                    defaultValue={exportInfo.datapackDescription}
                                    placeholder="Description"
                                    multiline
                                    inputProps={{ style: { fontSize: "16px", lineHeight: "20px" } }}
                                    fullWidth
                                    maxLength={250}
                                    // eslint-disable-next-line react/jsx-no-duplicate-props
                                    InputProps={{ className: classes.input, style: { lineHeight: "21px" } }}
                                />
                                <DebouncedTextField
                                    className={`qa-ExportInfo-input-project ${classes.textField}`}
                                    id="Project"
                                    name="projectName"
                                    setValue={onProjectChange}
                                    defaultValue={exportInfo.projectName}
                                    placeholder="Project Name"
                                    InputProps={{ className: classes.input }}
                                    fullWidth
                                    maxLength={100}
                                />
                            </div>
                        </div>
                        <div className={classes.heading}>
                            <div
                                id="layersHeader"
                                className="qa-ExportInfo-layersHeader"
                                style={{ marginRight: "5px" }}
                            >
                                Select Data Products
                            </div>
                            <div
                                id="layersSubheader"
                                style={{ fontWeight: "normal", fontSize: "12px", fontStyle: "italic" }}
                            >
                                (You must choose <strong>at least one</strong>)
                            </div>
                        </div>

                        <div
                            id="SortFilter"
                            className={`qa-ExportInfo-sortFilterContainer ${classes.sortFilterContainer}`}
                        >
                            <div className={classes.filterDropdownContainer}>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setShowProviderFilter(!showProviderFilter)}
                                    onKeyPress={() => setShowProviderFilter(!showProviderFilter)}
                                    className={
                                        showProviderFilter || providerFilterList.length || providerSearch
                                            ? classes.filterLabelDropdown
                                            : classes.filterLabel
                                    }
                                >
                                    Sort / Filter {getExpandIcon()}
                                </span>
                            </div>
                            {renderIf(
                                () => (
                                    <div className={classes.filterLabelDropdownChip}>
                                        {providerFilterList.map((filter) => (
                                            <Chip
                                                className={classes.filterChip}
                                                label={filter.name}
                                                onDelete={() => removeProviderFilter(filter)}
                                            />
                                        ))}
                                        {renderIf(
                                            () => (
                                                <Chip
                                                    className={classes.filterChip}
                                                    label={`Contains: ${providerSearch}`}
                                                    onDelete={() => setProviderSearch("")}
                                                />
                                            ),
                                            !!providerSearch
                                        )}
                                    </div>
                                ),
                                (providerFilterList.length || providerSearch) && !showProviderFilter
                            )}
                            {renderIf(
                                () => (
                                    <div className={`qa-ExportInfo-filterOptions-container ${classes.filterContainer}`}>
                                        <FormLabel component="legend" className={classes.legendLabel}>
                                            Filter By:
                                        </FormLabel>
                                        {filterOptions.map((filterType) =>
                                            renderIf(
                                                () => (
                                                    <div>
                                                        <FormGroup className={classes.formControlLabelContainer}>
                                                            <div style={{ width: "100%" }}>
                                                                <TextField
                                                                    id="searchByName"
                                                                    name="searchByName"
                                                                    inputProps={{ "data-testid": "filter-text-field" }}
                                                                    autoComplete="off"
                                                                    fullWidth
                                                                    className={`qa-ExportInfo-searchBarTextField ${classes.filterTextField}`}
                                                                    onChange={(e) => setProviderSearch(e.target.value)}
                                                                    value={providerSearch}
                                                                    placeholder={"Product Name"}
                                                                    InputProps={{
                                                                        style: {
                                                                            fontSize: "16px"
                                                                        },
                                                                        endAdornment: renderIf(
                                                                            () => (
                                                                                <InputAdornment
                                                                                    className={classes.searchFieldClear}
                                                                                    position="end"
                                                                                    onClick={() =>
                                                                                        setProviderSearch("")
                                                                                    }
                                                                                >
                                                                                    Clear
                                                                                </InputAdornment>
                                                                            ),
                                                                            providerSearch.length > 0
                                                                        )
                                                                    }}
                                                                />
                                                            </div>
                                                            <div style={{ marginTop: "3px", marginBottom: "10px" }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            className="qa-ExportInfo-CheckBox-filter"
                                                                            classes={{
                                                                                root: classes.checkbox,
                                                                                checked: classes.checked
                                                                            }}
                                                                            checked={isFilteringByFavorites}
                                                                            onChange={() => onFilterFavoritesChanged()}
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Typography className={classes.checkboxLabel}>
                                                                            Favorites
                                                                        </Typography>
                                                                    }
                                                                />
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            className="qa-ExportInfo-CheckBox-filter"
                                                                            classes={{
                                                                                root: classes.checkbox,
                                                                                checked: classes.checked
                                                                            }}
                                                                            checked={isFilteringByProviderGeometry}
                                                                            onChange={() =>
                                                                                onProviderGeometryFilterCheckboxChanged()
                                                                            }
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Typography className={classes.checkboxLabel}>
                                                                            Selected Area
                                                                        </Typography>
                                                                    }
                                                                />
                                                            </div>

                                                            <Collapsible
                                                                trigger={collapseTriggerContent(
                                                                    filterType.name,
                                                                    showTypeFilter
                                                                )}
                                                                contentHiddenWhenClosed={true}
                                                                open={showTypeFilter}
                                                                className={classes.collapsible}
                                                                openedClassName={classes.collapsible}
                                                                contentOuterClassName={classes.collapseOuterContent}
                                                                contentInnerClassName={classes.collapseInnerContent}
                                                                onTriggerOpening={() =>
                                                                    setShowTypeFilter(!showTypeFilter)
                                                                }
                                                                onTriggerClosing={() =>
                                                                    setShowTypeFilter(!showTypeFilter)
                                                                }
                                                            >
                                                                {filterType.options.map((filter) => (
                                                                    <div>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    className="qa-ExportInfo-CheckBox-filter"
                                                                                    classes={{
                                                                                        root: classes.checkbox,
                                                                                        checked: classes.checked
                                                                                    }}
                                                                                    checked={filter.isChecked}
                                                                                    onChange={() =>
                                                                                        onFilterCheckboxChanged(filter)
                                                                                    }
                                                                                />
                                                                            }
                                                                            label={
                                                                                <Typography
                                                                                    className={classes.checkboxLabel}
                                                                                >
                                                                                    {filter.name}
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </Collapsible>
                                                            <Collapsible
                                                                trigger={collapseTriggerContent(
                                                                    "Topic(s)",
                                                                    showTopicFilter
                                                                )}
                                                                contentHiddenWhenClosed={true}
                                                                open={showTopicFilter}
                                                                className={classes.collapsible}
                                                                openedClassName={classes.collapsible}
                                                                contentOuterClassName={classes.collapseOuterContent}
                                                                contentInnerClassName={classes.collapseInnerContent}
                                                                onTriggerOpening={() =>
                                                                    setShowTopicFilter(!showTopicFilter)
                                                                }
                                                                onTriggerClosing={() =>
                                                                    setShowTopicFilter(!showTopicFilter)
                                                                }
                                                                style={{ marginBottom: "0px" }}
                                                            >
                                                                {topics.map((topic) => (
                                                                    <div>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    className="qa-ExportInfo-CheckBox-filter"
                                                                                    classes={{
                                                                                        root: classes.checkbox,
                                                                                        checked: classes.checked
                                                                                    }}
                                                                                    name={`${topic.slug}`}
                                                                                    checked={
                                                                                        selectedTopics.indexOf(
                                                                                            topic.slug
                                                                                        ) != -1
                                                                                    }
                                                                                    onChange={onSelectTopic}
                                                                                />
                                                                            }
                                                                            label={
                                                                                <Typography
                                                                                    className={classes.checkboxLabel}
                                                                                >
                                                                                    {topic.name}
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </Collapsible>
                                                        </FormGroup>
                                                    </div>
                                                ),
                                                "options" in filterType
                                            )
                                        )}

                                        <hr className={classes.lineBreak} />

                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" className={classes.legendLabel}>
                                                Sort By:
                                            </FormLabel>
                                            <FormGroup className={classes.formControlLabelContainer}>
                                                <RadioGroup>
                                                    {sortOptions.map((sortOption) => (
                                                        <div>
                                                            <div>
                                                                <FormControlLabel
                                                                    className={classes.formControlLabel}
                                                                    value={sortOption.slug}
                                                                    control={
                                                                        <Radio
                                                                            classes={{
                                                                                root: classes.radio,
                                                                                checked: classes.checked
                                                                            }}
                                                                            data-testid={sortOption.slug}
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Typography className={classes.radioLabel}>
                                                                            {sortOption.name}
                                                                        </Typography>
                                                                    }
                                                                    checked={sortOption.isChecked}
                                                                    onChange={() => onSortRadioChanged(sortOption.slug)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </FormGroup>
                                        </FormControl>

                                        <Grid container spacing={2} className={classes.containerGrid}>
                                            <Grid item xs={4} md={8}>
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => clearAllFilterSort()}
                                                    onKeyPress={() => clearAllFilterSort()}
                                                    className={classes.clearAllButton}
                                                >
                                                    Clear All
                                                </span>
                                            </Grid>
                                            <Grid item xs={4} md={2}>
                                                <Button
                                                    className="qa-ExportInfo-Button-apply"
                                                    style={{
                                                        minWidth: "none",
                                                        borderRadius: "0px",
                                                        textTransform: "none",
                                                        display: "inline"
                                                    }}
                                                    color="primary"
                                                    variant="contained"
                                                    onClick={() => setShowProviderFilter(!showProviderFilter)}
                                                >
                                                    Apply
                                                </Button>
                                            </Grid>
                                            <Grid item xs={4} md={2}>
                                                <Button
                                                    className="qa-ExportInfo-Button-apply"
                                                    style={{
                                                        minWidth: "none",
                                                        borderRadius: "0px",
                                                        textTransform: "none",
                                                        color: "#BABABA",
                                                        display: "inline"
                                                    }}
                                                    variant="contained"
                                                    onClick={() => clearAndCloseSortFilter()}
                                                >
                                                    Cancel
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </div>
                                ),
                                filterOptions && showProviderFilter
                            )}
                        </div>

                        <div id="select" className={`qa-ExportInfo-selectAll ${classes.selectAll}`}>
                            <Checkbox
                                classes={{ root: classes.checkbox, checked: classes.checked }}
                                name="SelectAll"
                                checked={
                                    exportInfo.providers &&
                                    exportInfo.providers.length ===
                                        getCurrentProviders().filter((provider) => provider.display).length
                                }
                                onChange={onSelectAll}
                                style={{ width: "24px", height: "24px" }}
                            />
                            <span
                                style={{
                                    padding: "0px 15px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    fontSize: "16px"
                                }}
                            >
                                {providerFilterList.length || isFilteringByProviderGeometry
                                    ? "Select Visible"
                                    : "Select All"}
                            </span>
                        </div>
                        <div className={classes.sectionBottom}>
                            <div className={`qa-ExportInfo-ListHeader ${classes.listHeading}`}>
                                <div className="qa-ExportInfo-ListHeaderItem" style={{ flex: "1 1 auto" }}>
                                    DATA PRODUCTS
                                </div>
                                <div
                                    className="qa-ExportInfo-ListHeaderItem"
                                    style={{ display: "flex", justifyContent: "flex-end", position: "relative" }}
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
                                        style={{ pointerEvents: "none" }}
                                        PaperProps={{
                                            style: { padding: "16px" }
                                        }}
                                        open={Boolean(refreshPopover)}
                                        anchorEl={refreshPopover}
                                        onClose={handlePopoverClose}
                                        anchorOrigin={{
                                            vertical: "top",
                                            horizontal: "center"
                                        }}
                                        transformOrigin={{
                                            vertical: "bottom",
                                            horizontal: "center"
                                        }}
                                    >
                                        <div style={{ maxWidth: 400 }}>
                                            <Typography variant="h6" gutterBottom style={{ fontWeight: 600 }}>
                                                RUN AVAILABILITY CHECK AGAIN
                                            </Typography>
                                            <div>
                                                You may try to resolve errors by running the availability check again.
                                            </div>
                                        </div>
                                    </Popover>
                                </div>
                            </div>
                            {fetchingProviders ? (
                                <div style={{ display: "flex", justifyContent: "center", width: "100%", height: 500 }}>
                                    <CircularProgress disableShrink={true} size={50} />
                                </div>
                            ) : dataProviders.length > 0 ? (
                                <Virtuoso
                                    style={{ width: "100%", height: 500 }}
                                    id="ProviderList"
                                    totalCount={dataProviders.length}
                                    initialItemCount={10}
                                    itemContent={(index) => dataProviders[index]}
                                    className="qa-ExportInfo-List"
                                />
                            ) : (
                                <span
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        width: "100%",
                                        height: 50,
                                        fontSize: "16px"
                                    }}
                                >
                                    No providers found
                                </span>
                            )}

                            <div className={classes.stickyRow}>
                                <div
                                    className={classes.stickyRowItems}
                                    style={{ paddingLeft: "5px", paddingTop: "15px" }}
                                >
                                    <AddDataSource />
                                </div>
                            </div>
                        </div>
                        <div id="projectionHeader" className={`qa-ExportInfo-projectionHeader ${classes.heading}`}>
                            Select Projection
                        </div>
                        <div className={classes.sectionBottom}>
                            <div id="Projections" className={`qa-ExportInfo-projections ${classes.projections}`}>
                                {orderedProjections.map((projection, ix) => (
                                    <div
                                        key={projection.srid}
                                        style={{
                                            display: "flex",
                                            padding: "16px 10px",
                                            backgroundColor: ix % 2 === 0 ? colors.secondary : colors.white
                                        }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    className="qa-ExportInfo-CheckBox-projection"
                                                    classes={{ root: classes.checkbox, checked: classes.checked }}
                                                    name={`${projection.srid}`}
                                                    checked={exportInfo.projections.indexOf(projection.srid) !== -1}
                                                    style={{ width: "24px", height: "24px" }}
                                                    onChange={onSelectProjection}
                                                    data-testid={"projection-checkbox-" + ix}
                                                />
                                            }
                                            label={
                                                <Typography style={{ fontSize: "15px" }}>
                                                    EPSG:{projection.srid} - {projection.name}
                                                </Typography>
                                            }
                                        />
                                        {projectionHasErrors(projection.srid) && (
                                            <AlertWarning
                                                className={`qa-Projection-Warning-Icon`}
                                                onClick={() => {
                                                    handleProjectionCompatibilityOpen(projection);
                                                }}
                                                style={{
                                                    cursor: "pointer",
                                                    verticalAlign: "middle",
                                                    marginLeft: "5px",
                                                    height: "18px",
                                                    width: "18px",
                                                    color: "rgba(255, 162, 0, 0.87)"
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                                {projectionCompatibilityOpen && getProjectionDialog()}
                            </div>
                        </div>

                        <div id="ShareAll" className={`qa-ExportInfo-ShareHeader ${classes.heading}`}>
                            Share this DataPack
                        </div>
                        <div
                            id="select"
                            className={`qa-ExportInfo-selectAll ${classes.selectAll}`}
                            style={{ padding: "0px 10px 10px 8px" }}
                        >
                            <Checkbox
                                classes={{ root: classes.checkbox, checked: classes.checked }}
                                name="ShareAll"
                                checked={exportInfo.visibility === "PUBLIC"}
                                onChange={checkShareAll}
                                style={{ width: "24px", height: "24px" }}
                            />
                            <span
                                style={{
                                    padding: "0px 15px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    fontSize: "16px"
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
                                containerStyle={{ fontSize: "16px" }}
                            >
                                {exportInfo.areaStr}
                            </CustomTableRow>
                            <div style={{ padding: "15px 0px 20px" }}>
                                <MapCard geojson={geojson}>
                                    <span style={{ marginRight: "10px" }}>Selected Area of Interest</span>
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

function AddDataSource() {
    const [requestDataSourceOpen, setRequestDataSourceOpen] = useState(false);

    return (
        <>
            <RequestDataSource open={requestDataSourceOpen} onClose={() => setRequestDataSourceOpen(false)} />
            <Link onClick={() => setRequestDataSourceOpen(true)} style={{ cursor: "pointer" }}>
                Request New Data Product
            </Link>
        </>
    );
}

// TODO: Remove this function and debounce inline.
// Wrapper around the CustomTextField component that debounces the redux store call.
// This was done to avoid refactoring the entire component to hooks all at once.
// At a later point this could be removed and done in place.
function DebouncedTextField(props: any) {
    const { setValue, ...passThroughProps } = props;
    const [value, debounceValue] = useDebouncedState(props.defaultValue, 500);
    useEffect(() => {
        props.setValue(value);
    }, [value]);
    return (
        <CustomTextField
            onChange={(e) => debounceValue(e.target.value)}
            {...passThroughProps}
            className={`debounced-textField ${props.className ? props.className : ""}`}
        />
    );
}

export default withTheme(withStyles(jss)(ExportInfo));
