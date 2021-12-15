import React, {useEffect, useRef, useState} from 'react';
import {createStyles, Theme} from '@material-ui/core/styles';
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import {Chip, Grow, Link, Paper, TextField, withStyles} from "@material-ui/core";
import {renderIf} from "../../utils/renderIf";
import Radio from "@material-ui/core/Radio";
import {useDebouncedState, useProviderIdentity} from "../../utils/hooks/hooks";
import {arrayHasValue} from "../../utils/generic";
import {unionBy} from 'lodash';


const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    button: {
        backgroundColor: theme.eventkit.colors.white,
    },
    buttonExpanded: {
        borderTop: '1px solid rgba(0, 0, 0, 0.5)',
        borderRight: '1px solid rgba(0, 0, 0, 0.5)',
        borderLeft: '1px solid rgba(0, 0, 0, 0.5)',
    },
    paper: {
        padding: theme.spacing(1),
        width: '235px',
        borderTop: '1px solid rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
        borderRight: '1px solid rgba(0, 0, 0, 0.5)',
        borderLeft: '1px solid rgba(0, 0, 0, 0.5)',
        // zIndex: 100,
        position: 'absolute',
        right: '0px',

    },
    filterContainer: {
        display: 'block',
        flexWrap: 'wrap',
        width: '100%',
        zIndex: 1,
    },
    filterItem: {},
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '5px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
        '& span svg': {
            fontSize: '2rem',
        }
    },
    checked: {},
    input: {
        fontSize: '16px',
        padding: '0px'
    },
    buttonBackdrop: {
        height: '100%',
        width: '100%',
        position: 'absolute',
    },
    filterChip: {
        height: '26px',
        fontSize: '14px',
        border: '1px solid rgba(0, 0, 0, 0.5)',
        backgroundColor: theme.eventkit.colors.white,
        marginRight: '3px',
    },
    filterOptionBlock: {marginRight: '8px', fontSize: '11px', display: 'inline-block'},
    textField: {
        backgroundColor: 'aliceblue',
    },
});

// We build our filters here ahead of time
function buildFilters() {
    const filterType = (dataType: string) => (
        (provider: Eventkit.Provider) => (provider.data_type || 'Unknown').toLowerCase() === dataType.toLowerCase()
    );
    const filtersList = [
        {
            name: 'Elevation',
            expression: filterType('elevation'),
        },
        {
            name: 'Raster',
            expression: filterType('raster'),
        },
        {
            name: 'Vector',
            expression: filterType('vector'),
        },
        {
            name: 'Mesh',
            expression: filterType('mesh'),
        },
        {
            name: 'Point Cloud',
            expression: filterType('point_cloud'),
        },
        {
            name: 'Other',
            expression: (provider: Eventkit.Provider) => !arrayHasValue(
                ['elevation', 'raster', 'vector', 'mesh', 'point_cloud'], (provider?.data_type || 'Unknown').toLowerCase(),
            ),
        },
    ] as Partial<Filter>[];

    const filters = {};
    filtersList.map(_filter => filters[_filter.name] = {enabled: false, sources: [], exclusiveFilter: true, ..._filter})
    return filters;
}

export interface Filter {
    name: string;
    expression: (provider: Eventkit.Provider, ...args: any) => boolean;
    enabled: boolean;
    sources: string[];
    exclusiveFilter: boolean; // Can't be enabled with any other exclusive filter
}

interface Props {
    // filter name, number of sources relevant, whether it's enabled
    providers: Eventkit.Provider[];
    selected: Eventkit.Provider[];
    setProviders: (providers: Eventkit.Provider[]) => void;
    providerShouldDisplay: (provider: Eventkit.Provider) => boolean;
    onEnabled: (offset: number) => void;
    onDisabled: () => void;
    classes: { [className: string]: string };
}

export function MapDrawerOptions(props: Props) {
    const {classes} = props;
    const [open, setOpen] = useState(false);

    const [ visibleProviders, setVisibleProviders ] = useState([]);
    useProviderIdentity(() => {
        setVisibleProviders(props.providers.filter(
            _provider => props.providerShouldDisplay(_provider))
        );
    }, props.providers);

    const [_filters, _setFilters] = useState<{
        [filterName: string]: Filter;
    }>(() => buildFilters());
    const filters = Object.entries(_filters).map(([, _filter]) => _filter) as Filter[];

    function setFilter(...filters: Partial<Filter>[]) {
        _setFilters(_prevFiltersState => {
            // Create a new dict copying in the old state
            const newFilters = {
                ..._prevFiltersState,
            };
            // For each updated filter passed in, update the dict with all specified properties
            filters.forEach(_filter => {
                newFilters[_filter.name] = {
                    // Grab the filter's previous data if available and populate it.
                    ...(_prevFiltersState[_filter.name] || {}) as Filter,
                    // Overwrite the previous data with the new filter data, this may be partial.
                    ..._filter,
                }
            });
            return newFilters;
        })
    }

    function setFilterEnabled(filterName: string, isEnabled: boolean): boolean {
        if (arrayHasValue(Object.keys(_filters), filterName)) {
            const filter = filters.find(_filter => _filter.name === filterName);
            let enabled = filters.filter(_filter => _filter.enabled && _filter.exclusiveFilter) || [];
            enabled = (filter.exclusiveFilter) ? enabled : [];  // Clear the list if the current filter is not exclusive
            // Set the specified filter to be enabled, and disable any other filters
            setFilter({
                name: filterName,
                enabled: isEnabled,
            }, ...enabled.map(_filter => ({..._filter, enabled: false})));
        }
        return false;
    }

    useEffect(() => {
        // When sources is updated, we re-scan them to see which applies to which filter
        // We display the number of sources affected by each filter so we have to calculate them all ahead of time
        // If this ever becomes a bottle neck it should be transitioned to run async
        if (visibleProviders) {
            const updatedFilters = []
            Object.entries(_filters).map(([, _filter]) => {
                updatedFilters.push({
                    ..._filter,
                    sources: visibleProviders.filter(_filter.expression).map(_provider => _provider.name),
                });

            });
            setFilter(...updatedFilters);
        }
    }, [visibleProviders]);

    const [filterNameValue, setFilterNameValue] = useDebouncedState<string>('', 200);
    const [textFieldControlledValue, setTextFieldControlledValue] = useState<string>('');

    useEffect(() => {
        setFilterNameValue(textFieldControlledValue);
    }, [textFieldControlledValue]);

    useEffect(() => {
        // Find all enabled filters
        const enabled = filters.filter(_filter => _filter.enabled) || [] as Filter[];
        // If none are enabled, return early with ALL providers
        if (!enabled.length && !filterNameValue.length) {
            props.setProviders(props.providers);
            return;
        }
        let providerNames: any = new Set(); // Use a set to compile all source names and get rid of duplicates.
        enabled.forEach((_filter) => {
            _filter.sources.forEach(_provider => providerNames.add(_provider))
        });
        providerNames = [...providerNames]; // Convert set to array
        if (filterNameValue !== '') {
            if (!providerNames.length) {
                providerNames = props.providers.map(_provider => _provider.name);
            }
            providerNames = providerNames.filter(
                _sourceName => _sourceName.toLowerCase().includes(filterNameValue.toLowerCase())
            );
        }
        let filteredProviders = providerNames.map(
            _sourceName => props.providers.find(_source => _sourceName === _source.name) || []
        )
        let filteredWithSelected = unionBy(filteredProviders, props.selected || [], 'slug')
        props.setProviders([...filteredWithSelected]);
    }, [filterNameValue, _filters]);


    const paperRef = useRef(null);
    const anchorEl = paperRef.current;
    const shouldDisplay = open || filters.some(_filter => _filter.enabled) || !!filterNameValue.length;
    const handleClick = () => {
        setOpen(_previouslyOpen => !_previouslyOpen);
    };

    const offsetBox = useRef(null);
    useEffect(() => {
        let timeout;
        if (!shouldDisplay) {
            props.onDisabled();
        }
        if (shouldDisplay && offsetBox.current) {
            // Delay to ensure box is fully sized
            timeout = setTimeout(
                () => props.onEnabled(
                    offsetBox.current.getBoundingClientRect().height * 1.1
                ),
                100
            );
        }
        return () => window.clearTimeout(timeout);
    }, [shouldDisplay, open]);

    const id = !!anchorEl ? 'simple-popover' : undefined;

    function getExpandIcon() {
        return (
            <span style={{margin: 'auto'}}>
                {renderIf(() => (
                    <ExpandLess
                        id="ExpandButton"
                        // className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                        onClick={handleClick}
                        color="primary"
                    />
                ), !!open)}
                {renderIf(() => (
                    <ExpandMore
                        id="ExpandButton"
                        // className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                        onClick={handleClick}
                        color="primary"
                    />
                ), !open)}
            </span>
        );
    }

    function clear() {
        setFilter(...filters.map(_filter => ({
            ..._filter,
            enabled: false,
        })));
        setTextFieldControlledValue('');
        setFilterNameValue('');
    }

    function removeFilter(filterName: string) {
        setFilterEnabled(filterName, false);
    }

    function getAppliedFilterChips() {
        const chips = filters.filter(_filter => _filter.enabled).map(_filter => (
            <Chip
                className={classes.filterChip}
                label={_filter.name}
                onDelete={() => removeFilter(_filter.name)}
            />
        ));
        if (!!filterNameValue.length) {
            chips.push((
                <Chip
                    className={classes.filterChip}
                    label={`"${filterNameValue}"`}
                    onDelete={() => setTextFieldControlledValue('')}
                />
            ));
        }
        return (<span className="qa-applied-filter-chips">{chips}</span>);
    }

    function renderFilterOptions() {
        return (
            <div>
                <div className={`qa-MapDrawer-nameFilter-container ${classes.filterContainer}`}>
                    Filter by Name:
                    <TextField
                        id="searchByName"
                        name="searchByName"
                        autoComplete="off"
                        fullWidth
                        className={classes.textField}
                        value={textFieldControlledValue}
                        onChange={(e) => setTextFieldControlledValue(e.target.value)}
                    />
                </div>
                {renderIf(() => (
                    <div
                        className={`qa-MapDrawer-filterOptions-container ${classes.filterContainer}`}
                        style={{display: 'block', marginTop: '8px'}}
                    >
                        <div>
                            Or by type:
                        </div>
                        <div>
                            {filters.map((_filter) => (
                                <span className={classes.filterOptionBlock}>
                                <Radio
                                    checked={_filter.enabled}
                                    value={_filter.name}
                                    classes={{
                                        root: classes.checkbox, checked: classes.checked,
                                    }}
                                    onClick={() => setFilterEnabled(_filter.name, true)}
                                    name={`radio-${_filter.name}`}
                                />
                                    {`${_filter.name} (${_filter?.sources?.length})`}
                            </span>
                            ))}
                        </div>
                    </div>
                ), !!filters.length)}
                <div style={{display: 'flex'}}>
                    <Link onClick={clear} style={{marginLeft: 'auto', width: 'auto', cursor: 'pointer'}}>Clear</Link>
                </div>
            </div>
        );
    }

    // Renders the top box around the "Filter" and arrow icon.
    // Renders left, top, right borders with the first Paper, and uses the second paper to "erase" the bottom
    // border and the top piece of the lower box so they appear connected. This creates a tabbed appearance.
    function renderBorderBox() {
        return (
            <>
                <Grow in={shouldDisplay} style={{transformOrigin: 'top right', zIndex: 1}}>
                    <Paper
                        className={`
                        ${classes.button} ${shouldDisplay ? classes.buttonExpanded : ''} 
                        qa-MapDrawerOptions-Button ${classes.buttonBackdrop}
                        `}
                        square
                        elevation={0}
                        style={{zIndex: -1}}
                    />
                </Grow>
                <Grow in={shouldDisplay} style={{transformOrigin: 'top right', zIndex: 1}}>
                    <Paper
                        className={classes.buttonBackdrop}
                        square
                        elevation={0}
                        // This makes the second paper fit onto the front of the one below, obscuring the bottom
                        // border outline of it and the filter container, making them appear contiguous.
                        style={{top: '5px', zIndex: -1, width: 'calc(100% - 2px)', left: '1px'}}
                    />
                </Grow>
            </>
        );
    }

    return (
        <>
            <div>
                <div
                    aria-describedby={id}
                    className={`qa-MapDrawerOptions-Button`}
                    ref={_instance => paperRef.current = _instance}
                    style={{
                        display: 'block', position: 'relative',
                        zIndex: 10, width: 'fit-content', marginLeft: 'auto'
                    }}
                >
                    {renderBorderBox()}
                    <div style={{padding: '3px 5px', display: 'inline-flex'}}>
                        <Link onClick={handleClick} style={{margin: 'auto', cursor: 'pointer'}}>Filter</Link>
                        {getExpandIcon()}
                    </div>
                </div>
                {renderIf(() => (
                    <div className={`qa-MapDrawerOptions-FilterPanel`} style={{position: 'relative'}}>
                        <Grow in={shouldDisplay} style={{transformOrigin: 'top right', zIndex: 1}}>
                            <Paper className={classes.paper} square elevation={0} ref={offsetBox}>
                                {renderIf(getAppliedFilterChips, !open)}
                                {renderIf(renderFilterOptions, open)}
                            </Paper>
                        </Grow>
                    </div>
                ), shouldDisplay)}
            </div>
        </>
    );
}

export default withStyles<any, any>(jss)(MapDrawerOptions);