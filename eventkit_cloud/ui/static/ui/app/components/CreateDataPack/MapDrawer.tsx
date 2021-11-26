import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import CustomScrollbar from "../common/CustomScrollbar";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import {
    createStyles,
    Theme,
    withStyles,
    Icon,
    Divider, Link,
} from "@material-ui/core";
import {connect} from "react-redux";
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from "@material-ui/core/Radio";
import {Tab, Tabs} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Clear from '@material-ui/icons/Clear';
import theme from "../../styles/eventkit_theme";
import FootprintDisplay from "./FootprintDisplay";
import {MapLayer} from "./CreateExport";
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import * as olColor from 'ol/color'
import RequestDataSource from "./RequestDataSource";
import {useEffect, useState} from "react";
import UnavailableFilterPopup from "../DataPackPage/UnavailableFilterPopup";
import MapDrawerOptions from "./MapDrawerOptions";
import isEqual from 'lodash.isequal';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        zIndex: 5,
        display: 'flex',
    },
    flexContainer: {
        display: 'flex',
        position: 'absolute',
        right: '0',
    },
    drawerPaper: {
        overflow: 'initial',
        backgroundColor: '#fff',
        top: 'auto',
        width: '250px',
        height: 'calc(100vh - 180px)',
    },
    drawerHeader: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingBottom: '5px',
    },
    tabHeader: {
        right: '0px',
        top: '0',
        position: 'absolute',
        height: '100%',
        borderRadius: '0px',
    },
    tabs: {
        position: 'absolute',
        marginLeft: '-55px',
        width: '55px',
        visibility: 'visible',
        borderTopRightRadius: '0px',
        borderTopLeftRadius: '5px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '0px',
        height: 'auto',
        marginTop: '14px',
    },
    tab: {
        opacity: 1,
        minWidth: '0',
        borderTopRightRadius: '0px',
        borderTopLeftRadius: '2px',
        borderBottomLeftRadius: '2px',
        borderBottomRightRadius: '0px',
        '& img': {
            backgroundColor: theme.eventkit.colors.secondary,
        },
        '&$selected': {
            '& img': {
                backgroundColor: 'white',
            }
        },
    },
    scrollBar: {
        height: 'calc(100% - 125px)',
        width: '250px',
    },
    heading: {
        margin: 'auto 6px',
    },
    listItem: {
        marginBottom: '8px',
    },
    noPadding: {
        padding: '0',
    },
    buttonLabel: {
        alignContent: 'flex-start',
        marginBottom: '2px',
        color: theme.eventkit.colors.black,
        fontSize: '12px',
        wordBreak: 'break-word',
    },
    buttonLabelSecondary: {
        alignContent: 'flex-start',
        color: theme.eventkit.colors.text_primary,
        fontSize: '10px',
    },
    footprint_options: {
        paddingBottom: '10px'
    },
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '5px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
    },
    clear: {
        marginLeft: 'auto',
        cursor: 'pointer',
        width: '24px',
        height: '24px',
        color: theme.eventkit.colors.grey,
    },
    checked: {},
    selected: {},
    stickyRow: {
        height: '50px',
        width: '100%',
        display: 'block',
    },
    stickyRowSources: {
        height: '100px',
        bottom: '50px',
    },
    stickyRowItems: {
        flexGrow: 1,
    },
    button: {
        color: theme.eventkit.colors.white,
    },
    thumbnail: {
        flexShrink: 0,
        height: '35px',
        width: '70px',
        marginRight: '5px',
    },
    imageIcon: {
        width: '55px',
        height: '55px',
    },
});

export const VerticalTabs = withStyles(theme => ({
    flexContainer: {
        flexDirection: 'column'
    },
    indicator: {
        display: 'none',
    }
}))(Tabs);



// This should be used to facilitate user added base map sources (sources not derived from providers)
export interface BaseMapSource {
    footprintsLayer: MapLayer;
    mapLayer: MapLayer;
    name: string;
    type: string;
    thumbnail_url: string;
    data_type: string;
}

export interface Coverage {
    features: Feature[];
    provider: Eventkit.Provider;
}

export interface Props {
    providers: Eventkit.Provider[];
    sources: BaseMapSource[];
    coverages: Coverage[];
    updateBaseMap: (mapLayer: MapLayer) => void;
    addFootprintsLayer: (mapLayer: MapLayer) => void;
    removeFootprintsLayer: (mapLayer: MapLayer) => void;
    addCoverageGeos: (features: Feature[]) => void;
    removeCoverageGeos: (features: Feature[]) => void;
    classes: { [className: string]: string };
}

MapDrawer.defaultProps = {sources: []} as Props;

export function MapDrawer(props: Props) {
    const {providers, classes} = props;

    const [expandedSources, setExpandedSources] = useState([]);
    const [selectedTab, setSelectedTab] = useState('');
    const [selectedBaseMap, setBaseMap] = useState(null);
    const [selectedCoverages, setSelectedCoverages] = useState([]);
    const [requestDataSourceOpen, setRequestDataSourceOpen] = useState(false);

    function updateBaseMap(newBaseMapSource: BaseMapSource) {
        setBaseMap(newBaseMapSource);
        let mapLayer = {} as MapLayer;
        if (newBaseMapSource && newBaseMapSource.mapLayer) {
            mapLayer = newBaseMapSource.mapLayer;
        }
        props.updateBaseMap(mapLayer);
    }

    function getSourceProvider(source: BaseMapSource) {
        return (source && source.mapLayer) ? providers.find(prov => prov.slug === source.mapLayer.slug) : null
    }

    function handleChange(event, newValue) {
        if (selectedTab === newValue) {
            setSelectedTab('');
        } else {
            setSelectedTab(newValue);
        }
    }

    function handleExpandClick(event, selectedSource: BaseMapSource) {
        const selectedSources = [...props.sources] || [];
        if (event && event.target.checked) {
            let index;
            if (selectedSources.findIndex(isEqual, selectedSource) <= 0) {
                selectedSources.push(selectedSource)
            } else {
                index = selectedSources.findIndex(isEqual, selectedSource)
                if (index >= 0) {
                    selectedSources.splice(index, 1);
                }
            }
        } else {
            return null
        }
        setExpandedSources(selectedSources);
        updateBaseMap(selectedSource);
    }

    function handleCoverageClick(event, selectedCoverage) {
        const selected = selectedCoverages;
        const isSelectedCoverage = (cov) => cov.provider.slug === selectedCoverage.provider.slug
        if (event && event.target.checked) {
            if (selected.findIndex(isSelectedCoverage) <= 0) {
                selected.push(selectedCoverage)
                props.addCoverageGeos(selectedCoverage.features)
            }
        } else {
            let index = selected.findIndex(isSelectedCoverage);
            if (index >= 0) {
                props.removeCoverageGeos(selected[index].features)
                selected.splice(index, 1);
            }
        }
        setSelectedCoverages([...selected]);
    }

    function showFootprintData(source: BaseMapSource) {
        if (expandedSources && isEqual(selectedBaseMap, source)) {
            if (!!source.footprintsLayer) {
                return (
                    <FootprintDisplay
                        footprintsLayer={source.footprintsLayer}
                        addFootprintsLayer={props.addFootprintsLayer}
                        removeFootprintsLayer={props.removeFootprintsLayer}
                    />
                )
            }
        }
    }

    function clearCoverageGeos() {
        selectedCoverages.forEach((cov) => props.removeCoverageGeos(cov.features));
        setSelectedCoverages([]);
    }

    function colorWithAlpha(color, alpha) {
        const [r, g, b] = color;
        return olColor.asString([r, g, b, alpha]);
    }

    function getRandomColor() {
        var rgb = [];
        for (var i = 0; i < 3; i++)
            rgb.push(Math.floor(Math.random() * 255));
        return rgb
    }

    function getFeatureStyle(featureName) {
        let randomColor = getRandomColor()
        let fillColor = colorWithAlpha(randomColor, 0.1)
        let strokeColor = colorWithAlpha(randomColor, 0.7)
        let style = new Style({
            stroke: new Stroke({color: strokeColor, width: 2}),
            fill: new Fill({color: fillColor}),
            text: new Text({
                text: featureName,
                font: '14px Calibri,sans-serif',
                stroke: new Stroke({color: theme.eventkit.colors.text_primary, width: 3}),
                fill: new Fill({color: theme.eventkit.colors.white}),
            })
        });
        return style
    }

    const drawerOpen = !!selectedTab;
    const areProvidersHidden = providers.find(provider => provider.hidden === true);

    const [ offSet, setOffSet ] = useState(0);

    const [ filteredProviders, setFilteredProviders ] = useState(() => providers || null);
    const [ filteredCoverageProviders, setFilteredCoverageProviders ] = useState(() => providers || null);

    useEffect(() => {
        if (filteredProviders === null) {
            setFilteredProviders(providers || null);
        }
        if (filteredCoverageProviders === null) {
            setFilteredCoverageProviders(providers || null);
        }
    }, [providers]);

    const [sources, setSources] = useState([]);
    const [coverages, setCoverages] = useState([]);
    useEffect(() => {
        setSources([
            ...filteredProviders.filter(_provider =>
                !!_provider && !_provider.hidden && !!_provider.preview_url && !!_provider.display).map(_provider => {
                let footprintsLayer;
                if (!!_provider.footprint_url) {
                    footprintsLayer = {
                        mapUrl: _provider.footprint_url,
                        slug: `${_provider.slug}-footprints`,
                    } as MapLayer;
                }
                return {
                    footprintsLayer,
                    mapLayer: {
                        mapUrl: _provider.preview_url,
                        metadata: _provider.metadata,
                        slug: _provider.slug,
                        copyright: _provider.service_copyright,
                    } as MapLayer,
                    name: _provider.name,
                    type: _provider.type,
                    data_type: _provider.data_type,
                    thumbnail_url: _provider.thumbnail_url,
                } as BaseMapSource;
            })
        ]);
    }, [filteredProviders]);

    useEffect(() => {
        setCoverages([
            ...filteredCoverageProviders.filter(_provider =>
                !!_provider && !_provider.hidden && !!_provider.the_geom && !!_provider.display).map(_provider => {

                const features = []
                const geos = _provider.the_geom.coordinates
                const style = getFeatureStyle(_provider.name)
                geos.forEach(function (coords) {
                    const polygon = new Polygon(coords);
                    const feature = new Feature({
                        geometry: polygon,
                    });
                    feature.setStyle(style)
                    features.push(feature)
                })

                return {
                    features: features,
                    provider: _provider,
                } as Coverage;
            })
        ]);
    }, [filteredCoverageProviders]);

    return (
        <div
            className={classes.container}
        >
            <div
                className={classes.flexContainer}
                style={{zIndex: 5, marginRight: (drawerOpen) ? '250px' : '0px'}}
            >
                <Drawer
                    className="qa-MapDrawer-Drawer"
                    variant="persistent"
                    anchor="right"
                    open={drawerOpen}
                    style={{flexShrink: 0}}
                    PaperProps={{
                        className: classes.drawerPaper,
                        // style: {visibility: selectedTab === 'basemap' ? 'visible' as 'visible' : 'hidden' as 'hidden'},
                    }}
                >
                    <VerticalTabs
                        className={classes.tabs}
                        value={(selectedTab) ? selectedTab : false}
                        onChange={handleChange}
                    >
                        <Tab
                            value="basemap"
                            classes={{
                                root: classes.tab,
                                selected: classes.selected,
                            }}
                            label={(
                                <Card className={classes.tabHeader}>
                                    <Icon classes={{root: classes.iconRoot}}>
                                        <img
                                            className={classes.imageIcon}
                                            src={theme.eventkit.images.basemap}
                                            alt="Basemap"
                                            title="Basemap"
                                        />
                                    </Icon>
                                </Card>)}
                        />
                        <Tab
                            value="coverage"
                            classes={{
                                root: classes.tab,
                                selected: classes.selected,
                            }}
                            label={(
                                <Card className={classes.tabHeader}>
                                    <Icon classes={{root: classes.iconRoot}}>
                                        <img
                                            className={classes.imageIcon}
                                            src={theme.eventkit.images.overlays}
                                            alt="Coverage"
                                            title="Coverage"
                                        />
                                    </Icon>
                                </Card>)}
                        />
                    </VerticalTabs>

                    {selectedTab === 'basemap' &&
                        <div style={{height: '100%'}}>
                            <div style={{display: 'block'}} className={classes.heading}>
                                <div style={{display: 'flex'}}>
                                    <strong style={{fontSize: '18px', margin: 'auto 0'}}>Basemaps</strong>
                                    <Clear
                                        className={classes.clear}
                                        color="primary"
                                        onClick={(event) => setSelectedTab('')}
                                    />
                                </div>
                                <div style={{display: 'flex'}}>
                                    <strong style={{margin: 'auto 0'}}>
                                        Select a basemap
                                    </strong>
                                    <span style={{marginLeft: 'auto', marginRight: '3px'}}>
                                    <MapDrawerOptions
                                        providers={providers}
                                        selected={[getSourceProvider(selectedBaseMap)]}
                                        setProviders={setFilteredProviders}
                                        onEnabled={(offset: number) => setOffSet(offset)}
                                        onDisabled={() => setOffSet(0)}
                                    />
                                    </span>
                                </div>
                            </div>

                            <div className={classes.scrollBar}
                                 style={areProvidersHidden ? {} : {height: 'calc(100% - 115px)'}}>
                                <CustomScrollbar>
                                    <div style={{height: `${offSet}px`}}/>
                                    <List style={{padding: '10px'}}>
                                        {(sources || []).map((source) => (
                                                <div key={source.mapLayer.slug}>
                                                    <ListItem className={`${classes.listItem} ${classes.noPadding}`}>
                                                    <span style={{marginRight: '2px'}}>
                                                        <Radio
                                                            checked={isEqual(selectedBaseMap, source)}
                                                            value={source.mapLayer.slug}
                                                            classes={{
                                                                root: classes.checkbox, checked: classes.checked,
                                                            }}
                                                            onClick={(e) => handleExpandClick(e, source)}
                                                            name="source"
                                                        />
                                                    </span>
                                                        <div>
                                                            <div style={{display: 'flex'}}>
                                                                {source.thumbnail_url &&
                                                                <CardMedia
                                                                    className={classes.thumbnail}
                                                                    image={source.thumbnail_url}
                                                                />
                                                                }
                                                                <ListItemText
                                                                    className={classes.noPadding}
                                                                    disableTypography
                                                                    primary={
                                                                        <Typography
                                                                            className={classes.buttonLabel}
                                                                        >
                                                                            {source.name}
                                                                        </Typography>
                                                                    }
                                                                />
                                                            </div>
                                                            <div className={classes.buttonLabelSecondary}>
                                                                {source.data_type && source.data_type[0].toUpperCase() + source.data_type.substring(1)}
                                                            </div>
                                                        </div>
                                                    </ListItem>
                                                    <div
                                                        className={classes.footprint_options}
                                                    >
                                                        {showFootprintData(source)}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </List>
                                </CustomScrollbar>
                            </div>
                            <Divider style={{margin: '0 5px 0 5px'}}/>

                            <div
                                className={`${classes.stickyRow} ${areProvidersHidden ? classes.stickyRowSources : ''}`}
                            >
                                <div
                                    className={classes.stickyRowItems}
                                    style={{paddingLeft: '8px', paddingTop: '8px', display: 'flex',}}
                                >
                                    <div style={{marginRight: '8px'}}>
                                        <RequestDataSource open={requestDataSourceOpen}
                                                           onClose={() => setRequestDataSourceOpen(false)}/>
                                        <div>
                                            Data Source Missing?
                                        </div>
                                        <Link onClick={() => setRequestDataSourceOpen(true)}
                                              style={{fontSize: '12px', cursor: 'pointer'}}>
                                            Request New Data Source
                                        </Link>
                                    </div>
                                    <div>
                                        <Button
                                            className={`${classes.button} ${classes.stickRowyItems}`}
                                            color="primary"
                                            variant="contained"
                                            disabled={!selectedBaseMap}
                                            // -1 clear the map
                                            onClick={() => {
                                                updateBaseMap(null);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                                {areProvidersHidden && <UnavailableFilterPopup/>}
                            </div>
                        </div>
                    }

                    {selectedTab === 'coverage' &&
                        <div style={{height: '100%'}}>
                            <div style={{display: 'block'}} className={classes.heading}>
                                <div style={{display: 'flex'}}>
                                    <strong style={{fontSize: '18px', margin: 'auto 0'}}>Coverage</strong>
                                    <Clear
                                        className={classes.clear}
                                        color="primary"
                                        onClick={(event) => setSelectedTab('')}
                                    />
                                </div>
                                <div style={{display: 'flex'}}>
                                    <strong style={{margin: 'auto 0'}}>
                                        Select footprints
                                    </strong>
                                    <span style={{marginLeft: 'auto', marginRight: '3px'}}>
                                    <MapDrawerOptions
                                        providers={providers}
                                        selected={selectedCoverages.map((cov) => cov.provider)}
                                        setProviders={setFilteredCoverageProviders}
                                        onEnabled={(offset: number) => setOffSet(offset)}
                                        onDisabled={() => setOffSet(0)}
                                    />
                                    </span>
                                </div>
                            </div>

                            <div className={classes.scrollBar}
                                 style={areProvidersHidden ? {} : {height: 'calc(100% - 115px)'}}>
                                <CustomScrollbar>
                                    <div style={{height: `${offSet}px`}}/>
                                    <List style={{padding: '10px'}}>
                                        {(coverages || []).map((coverage) => (
                                                <div key={coverage.provider.slug}>
                                                    <ListItem className={`${classes.listItem} ${classes.noPadding}`}>
                                                    <span style={{marginRight: '2px'}}>

                                                        <Checkbox
                                                            checked={selectedCoverages.some((cov) => cov.provider.slug === coverage.provider.slug)}
                                                            value={coverage.provider.slug}
                                                            classes={{
                                                                root: classes.checkbox, checked: classes.checked,
                                                            }}
                                                            onClick={(e) => handleCoverageClick(e, coverage)}
                                                            name="coverage"
                                                        />

                                                    </span>
                                                        <div>
                                                            <div style={{display: 'flex'}}>
                                                                <ListItemText
                                                                    className={classes.noPadding}
                                                                    disableTypography
                                                                    primary={
                                                                        <Typography
                                                                            className={classes.buttonLabel}
                                                                        >
                                                                            {coverage.provider.name}
                                                                        </Typography>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </ListItem>
                                                </div>
                                            )
                                        )}
                                    </List>
                                </CustomScrollbar>
                            </div>
                            <Divider style={{margin: '0 5px 0 5px'}}/>

                            <div
                                className={`${classes.stickyRow} ${areProvidersHidden ? classes.stickyRowSources : ''}`}
                            >
                                <div
                                    className={classes.stickyRowItems}
                                    style={{paddingLeft: '8px', paddingTop: '8px', display: 'flex',}}
                                >
                                    <div style={{marginRight: '8px'}}>
                                        <RequestDataSource open={requestDataSourceOpen}
                                                           onClose={() => setRequestDataSourceOpen(false)}/>
                                        <div>
                                            Data Source Missing?
                                        </div>
                                        <Link onClick={() => setRequestDataSourceOpen(true)}
                                              style={{fontSize: '12px', cursor: 'pointer'}}>
                                            Request New Data Source
                                        </Link>
                                    </div>
                                    <div>
                                        <Button
                                            className={`${classes.button} ${classes.stickRowyItems}`}
                                            color="primary"
                                            variant="contained"
                                            disabled={selectedCoverages === undefined || selectedCoverages.length === 0}
                                            onClick={() => {
                                                clearCoverageGeos();
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                                {areProvidersHidden && <UnavailableFilterPopup/>}
                            </div>
                        </div>
                    }

                </Drawer>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        providers: state.providers,
    };
}

export default (withStyles<any, any>(jss)(connect(mapStateToProps)(MapDrawer)));
