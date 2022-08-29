import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import CircularProgress from '@material-ui/core/CircularProgress';
import Checkbox from '@material-ui/core/Checkbox';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Star from "@material-ui/icons/Star";
import StarBorder from "@material-ui/icons/StarBorder";
import ProviderStatusCheck from './ProviderStatusCheck';
import BaseDialog from '../Dialog/BaseDialog';
import {arrayHasValue, formatMegaBytes, getDuration, isZoomLevelInRange, supportsZoomLevels} from '../../utils/generic';
import {Typography} from "@material-ui/core";
import ZoomLevelSlider from "./ZoomLevelSlider";
import {connect} from "react-redux";
import {updateExportInfo} from '../../actions/datacartActions';
import debounce from 'lodash/debounce';
import FormatSelector from "./FormatSelector";
import {Compatibility} from '../../utils/enums';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import {IncompatibilityInfo} from "./ExportInfo";
import {MapLayer} from "./CreateExport";
import OlMouseWheelZoom from "../MapTools/OpenLayers/MouseWheelZoom";
import ZoomUpdater from "./ZoomUpdater";
import ProviderPreviewMap from "../MapTools/ProviderPreviewMap";
import PoiQueryDisplay from "../MapTools/PoiQueryDisplay";
import OlMapClickEvent from "../MapTools/OpenLayers/OlMapClickEvent";
import SwitchControl from "../common/SwitchControl";
import Icon from "ol/style/Icon";
import {DepsHashers, useEffectOnMount} from "../../utils/hooks/hooks";
import {useAppContext} from "../ApplicationContext";
import {useJobValidationContext} from "./context/JobValidation";
import {RegionJustification} from "../StatusDownloadPage/RegionJustification";
import {renderIf} from "../../utils/renderIf";
import ZoomOutAtZoomLevel from "../MapTools/OpenLayers/ZoomOutAtZoomLevel";

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
        padding: '14px 40px',
        [theme.breakpoints.only('xs')]: {
            padding: '10px 10px',
        },
        borderTop: theme.eventkit.colors.secondary,
    },
    checkbox: {
        marginRight: '15px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
        '& svg': {
            fontSize: '24px',
        }
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
    listItemPadding: {
        padding: '10px 40px',
        [theme.breakpoints.only('xs')]: {
            padding: '10px 15px',
        },
    },
    star: {
        verticalAlign: 'bottom',
        fontSize: 32,
    },
});

interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providerOptions: any;
    updateExportInfo: (args: any) => void;
    provider: Eventkit.Provider;
    providerInfo: Eventkit.Store.ProviderInfo;
    checkProvider: (args: any) => void;
    isProviderLoading: boolean;
    clearEstimate: (provider: Eventkit.Provider) => void;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    deselect: any;
    alt: boolean;
    theme: Eventkit.Theme & Theme;
    renderEstimate: boolean;
    selectedProjections: number[];
    incompatibilityInfo: IncompatibilityInfo;
    open: boolean;
    getRef: (ref: any) => void;
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
        listItemPadding: string;
        star: string;
    };
}



export function DataProvider(props: Props) {
    const {BASEMAP_URL} = useAppContext();
    const {colors} = props.theme.eventkit;
    const {classes, provider, providerInfo} = props;
    const {exportOptions} = props.exportInfo;

    const [isOpen, setOpen] = useState(false);
    const [isLicenseOpen, setLicenseOpen] = useState(false);
    const [displayFootprints, setDisplayFootprints] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false)

    const {dataSizeInfo, aoiArea, aoiBboxArea, providerLimits} = useJobValidationContext();
    const {haveAvailableEstimates = [], noMaxDataSize = []} = dataSizeInfo || {};
    const [overSize, setOverSize] = useState(false);
    const [overArea, setOverArea] = useState(false);
    const [isProviderLoading, setProviderLoading] = useState(props.checked);
    const debouncerRef = useRef(null);
    const estimateDebouncer = (...args) => debouncerRef.current(...args);

    useEffectOnMount(() => {
        debouncerRef.current = debounce((val) => {
            props.clearEstimate(val);
        }, 1000);
    });

    const [providerHasEstimates, setHasEstimates] = useState(() =>
        arrayHasValue(haveAvailableEstimates, provider.slug));
    useEffect(() => {
        setHasEstimates(arrayHasValue(haveAvailableEstimates, provider.slug));
        if(arrayHasValue(haveAvailableEstimates, provider.slug)) {
            setProviderLoading(false);
        }
    }, [isProviderLoading, DepsHashers.arrayHash(haveAvailableEstimates), DepsHashers.arrayHash(noMaxDataSize)]);

    useEffect(() => {
        const limits = providerLimits.find(limits => limits.slug === props.provider.slug);
        if (providerInfo.estimates && limits) {
            const {size = {value: -1}} = providerInfo.estimates;
            const {maxArea = 0, maxDataSize = 0} = limits;
            const area = limits.useBbox ? aoiBboxArea : aoiArea;
            setOverArea(maxArea && area > maxArea);
            setOverSize(!arrayHasValue(noMaxDataSize, provider.slug) && (maxDataSize && size.value > maxDataSize));
        }
    }, [isProviderLoading, aoiArea, aoiBboxArea]);

    function getFormatCompatibility(formatSlug: string) {
        const formatInfo = props.incompatibilityInfo.formats[formatSlug.toLowerCase()];
        if (!formatInfo) {
            return Compatibility.Full;
        }
        const incompatibleProjections = props.incompatibilityInfo.formats[formatSlug.toLowerCase()].projections.length;
        if (incompatibleProjections >= props.selectedProjections.length) {
            return Compatibility.None;
        } else if (incompatibleProjections > 0) {
            return Compatibility.Partial;
        }
        return Compatibility.Full;
    }

    function setZoom(minZoom: number, maxZoom: number) {
        // update the state with the new array of options
        const {provider} = props;
        const providerOptions = {...props.providerOptions};

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
            ...props.exportInfo.exportOptions,
            [provider.slug]: {
                ...providerOptions,
                minZoom,
                maxZoom,
            }
        };
        props.updateExportInfo({
            exportOptions: updatedExportOptions,
        });
        estimateDebouncer(props.provider);
    }

    function handleLicenseOpen() {
        setLicenseOpen(true);
    }

    function handleLicenseClose() {
        setLicenseOpen(false);
    }

    function handleExpand() {
        setOpen((val) => !val);
    }

    function handleFootprintsCheck() {
        setDisplayFootprints((val) => !val);
    }

    function formatEstimate(providerEstimates: Eventkit.Store.Estimates) {
        if (!providerEstimates) {
            return '';
        }
        let sizeEstimate;
        let durationEstimate;
        // func that will return nf (not found) when the provided estimate is undefined
        const get = (estimate, nf = 'unknown') => (estimate) ? estimate.toString() : nf;

        if (providerEstimates.size) {
            sizeEstimate = formatMegaBytes(providerEstimates.size.value);
        }
        if (providerEstimates.time) {
            const estimateInSeconds = providerEstimates.time.value;
            durationEstimate = getDuration(estimateInSeconds);
        }
        return `${get(sizeEstimate)} / ${get(durationEstimate)}`;
    }

    function isIndeterminate() {
        // If every format is fully compatible with every projection, this value will be true.
        // This means we can display a normal checkbox, otherwise we indicate there is an issue
        // by using an indeterminate icon for the checkbox.
        const selectedFormats = props.providerOptions.formats;
        return !selectedFormats || !selectedFormats.map(
            (formatSlug) => getFormatCompatibility(formatSlug) === Compatibility.Full).every(value => !!value);
    }

    // Take the current zoom from the current zoomLevels if they exist and the value is valid,
    // otherwise set it to the max allowable level.
    let currentMaxZoom = provider.level_to;
    let currentMinZoom = provider.level_from;
    if (exportOptions[provider.slug]) {
        const {maxZoom, minZoom} = exportOptions[provider.slug];
        if (maxZoom || maxZoom === 0) {
            currentMaxZoom = maxZoom;
        }
        if (minZoom || minZoom === 0) {
            currentMinZoom = minZoom;
        }
    }

    const selectedBasemap = {
        mapUrl: (props.provider.preview_url || BASEMAP_URL),
        metadata: provider.metadata,
        slug: (!!props.provider.preview_url) ? provider.slug : undefined,
    } as MapLayer;
    const [renderZoomOut, setRenderZoomOut] = useState(false);

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
                            onClick={handleLicenseOpen}
                            onKeyPress={handleLicenseOpen}
                            className={classes.license}
                        >
                            {provider.license.name}
                        </span>
                    </i>
                    <BaseDialog
                        show={isLicenseOpen}
                        title={provider.license.name}
                        onClose={handleLicenseClose}
                    >
                        <div className={classes.prewrap}>{provider.license.text}</div>
                    </BaseDialog>
                </div>
            </ListItem>
        ));
    }
    if (supportsZoomLevels(props.provider)) {

        nestedItems.push(
            <div
                className={`qa-DataProvider-ListItem-zoomSelection`}
                id={'ZoomSelection'}
                key={nestedItems.length}
            >
                <div
                    className={`qa-DataProvider-ListItem-zoomSlider ${props.provider.slug + '-sliderDiv ' + classes.listItemPadding}`}
                    key={props.provider.slug + '-sliderDiv'}
                >
                    <ZoomLevelSlider
                        updateZoom={setZoom}
                        selectedMaxZoom={currentMaxZoom}
                        selectedMinZoom={currentMinZoom}
                        maxZoom={provider.level_to}
                        minZoom={provider.level_from}
                        handleCheckClick={handleFootprintsCheck}
                        checked={displayFootprints}
                    >
                        {props.provider.footprint_url &&
                        <SwitchControl onSwitch={handleFootprintsCheck} isSwitchOn={displayFootprints}/>
                        }
                    </ZoomLevelSlider>
                </div>
            </div>)
    } else {
        nestedItems.push(
            <ListItem
                className={`qa-DataProvider-ListItem-zoomSlider ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div>
                    <em>Zoom selection not available for this source.</em>
                </div>
            </ListItem>
        );
    }
    nestedItems.push(
        <div
            className={`qa-DataProvider-ListItem-zoomMap ${props.provider.slug + '-mapDiv ' + classes.listItemPadding}`}
            key={props.provider.slug + '-mapDiv'}
        >
            <ProviderPreviewMap
                style={{height: '290px'}}
                geojson={props.geojson}
                zoomLevel={currentMaxZoom}
                provider={props.provider}
                visible={isOpen}
                displayFootprints={displayFootprints}
            >
                {renderIf(() => (<ZoomOutAtZoomLevel zoomLevel={4}/>), renderZoomOut)}
                <ZoomUpdater setZoom={setZoom}/>
                <OlMouseWheelZoom enabled={false}/>
                <PoiQueryDisplay
                    style={{
                        width: 'max-content',
                        minWidth: '200px',
                        justifyContent: 'center',
                    }}
                    selectedLayer={selectedBasemap}
                >
                    <OlMapClickEvent mapPinStyle={{
                        image: new Icon({
                            src: props.theme.eventkit.images.map_pin,
                        })
                    }}/>
                </PoiQueryDisplay>
            </ProviderPreviewMap>
        </div>
    )
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
                        getFormatCompatibility={getFormatCompatibility}
                        provider={provider}
                        incompatibilityInfo={props.incompatibilityInfo}
                    />
                </div>
            </div>
        </ListItem>
    ));

    // Only set this if we want to display the estimate
    let secondary;
    if (props.renderEstimate) {
        const estimate = formatEstimate(providerInfo.estimates);
        if (estimate) {
            secondary =
                <Typography style={{fontSize: "0.7em"}}>{estimate}</Typography>;
        } else if (isProviderLoading) {
            secondary = <CircularProgress style={{display: 'grid'}} size={11}/>;
        } else {
            secondary = <Typography style={{fontSize: "0.7em"}}/>
        }
    }

    const [displayJustification, setDisplayJustification] = useState(false);

    function selectCheckbox(e: any) {
        props.onChange(e);
        if (e.target.checked) {
            if (!providerHasEstimates) {
                if (!props.checked) {
                    props.checkProvider(e);
                    setProviderLoading(true);
                }
            }else{
                setProviderLoading(false);
            }
        } else {
            setProviderLoading(false);
        }
        setDisplayJustification(true);
    }

    const backgroundColor = (props.alt) ? colors.secondary : colors.white;

    function getRef() {
        return {
            handleExpand: handleExpand,
            open: isOpen,
        }
    }

    if (props.getRef) {
        props.getRef(getRef());
    }

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
                        size="medium"
                        checked={props.checked}
                        checkedIcon={(<CheckBoxIcon/>)}
                        indeterminateIcon={(<IndeterminateCheckBoxIcon/>)}
                        indeterminate={isIndeterminate()}
                        onChange={selectCheckbox}
                    />
                    {renderIf(() => (
                        <RegionJustification
                            providers={[provider]}
                            extents={[props.geojson as any]}
                            onClose={() => {
                                setZoom(null, 2);
                                props.deselect(provider);
                                setDisplayJustification(false);
                            }}
                            onBlockSignal={() => setRenderZoomOut(true)}
                            onUnblockSignal={() => setRenderZoomOut(false)}
                        />
                    ), displayJustification)}
                    <ListItemText
                        disableTypography
                        classes={{root: classes.listItemText}}
                        primary={<Typography style={{fontSize: "1.0em"}}>{provider.name}</Typography>}
                        secondary={secondary}
                    />
                    <span style={{flex: '10 1 auto'}}>
                        {isFavorite ? <Star
                        id="Favorite"
                        className={classes.star}
                        onClick={() => setIsFavorite(!isFavorite)}
                        color="primary"
                    /> : <StarBorder
                                id="UnFavorite"
                                className={classes.star}
                                onClick={() => setIsFavorite(!isFavorite)}
                                color="primary"
                            />}

                    </span>
                    <ProviderStatusCheck
                        id="ProviderStatus"
                        baseStyle={{marginRight: '40px'}}
                        availability={providerInfo.availability}
                        overArea={overArea}
                        overSize={overSize}
                        isProviderLoading={isProviderLoading}
                        supportsZoomLevels={supportsZoomLevels(props.provider)}
                        provider={provider}
                        aoiArea={aoiArea}
                        providerInfo={providerInfo}
                        geojson={props.geojson}
                    />
                    <span className="qa-expandTarget">
                    {isOpen ?
                        <ExpandLess
                            id="ExpandButton"
                            className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                            onClick={handleExpand}
                            color="primary"
                        />
                        :
                        <ExpandMore
                            id="ExpandButton"
                            className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                            onClick={handleExpand}
                            color="primary"
                        />
                    }
                    </span>
                </div>
            </ListItem>
            <Collapse in={isOpen} key={`${provider.uid}-expanded`}>
                <List style={{backgroundColor}}>
                    {nestedItems}
                </List>
            </Collapse>
        </React.Fragment>
    );
}

DataProvider.defaultProps = {
    renderEstimate: false
};

function mapStateToProps(state, ownProps) {
    return {
        providerOptions: state.exportInfo.exportOptions[ownProps.provider.slug] || {} as Eventkit.Store.ProviderExportOptions,
        providerInfo: state.exportInfo.providerInfo[ownProps.provider.slug] || {} as Eventkit.Store.ProviderInfo,
        exportInfo: state.exportInfo,
        geojson: state.aoiInfo.geojson,
        selectedProjections: [...state.exportInfo.projections],
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
    };
}

export default React.memo(withTheme(withStyles(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataProvider))));
