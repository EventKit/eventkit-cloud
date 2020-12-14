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
    Divider, Link, Menu, MenuItem
} from "@material-ui/core";
import {connect} from "react-redux";
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';

import Radio from "@material-ui/core/Radio";
import {Tab, Tabs} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Clear from '@material-ui/icons/Clear';
import theme from "../../styles/eventkit_theme";
import FootprintDisplay from "./FootprintDisplay";
import {MapLayer} from "./CreateExport";
import RequestDataSource from "./RequestDataSource";
import {useEffect, useState} from "react";
import UnavailableFilterPopup from "../DataPackPage/UnavailableFilterPopup";
import MapDrawerOptions from "./MapDrawerOptions";
import {arrayHasValue} from "../../utils/generic";

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
        boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)',
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
        backgroundColor: theme.eventkit.colors.secondary,
        boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2) ',
    },
    tab: {
        opacity: 1,
        minWidth: '0',
        borderTopRightRadius: '0px',
        borderTopLeftRadius: '2px',
        borderBottomLeftRadius: '2px',
        borderBottomRightRadius: '0px',
        backgroundColor: 'lightgrey',
        '& img': {
            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 2px 1px -1px rgba(0,0,0,0.12)',
        },
        '&$selected': {
            '& img': {
                backgroundColor: theme.eventkit.colors.secondary,
            }
        }
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
    mapLayer: MapLayer;
    name: string;
    type: string;
    thumbnail_url: string;
    data_type: string;
}

export interface Props {
    providers: Eventkit.Provider[];
    sources: BaseMapSource[];
    updateBaseMap: (mapLayer: MapLayer) => void;
    addFootprintsLayer: (mapLayer: MapLayer) => void;
    removeFootprintsLayer: (mapLayer: MapLayer) => void;
    classes: { [className: string]: string };
}

MapDrawer.defaultProps = {sources: []} as Props;

export function MapDrawer(props: Props) {
    const {providers, classes} = props;

    const [expandedSources, setExpandedSources] = useState([]);
    const [selectedTab, setSelectedTab] = useState(false);
    const [selectedBaseMap, setBaseMap] = useState(-1);
    const [requestDataSourceOpen, setRequestDataSourceOpen] = useState(false);

    function updateBaseMap(newBaseMapId: number, sources) {
        setBaseMap(newBaseMapId);
        let mapLayer = {} as MapLayer;
        if ((!!newBaseMapId || newBaseMapId === 0) && newBaseMapId !== -1) {
            mapLayer = {...sources[newBaseMapId]}.mapLayer;
        }
        props.updateBaseMap(mapLayer);
    }

    function handleChange(event, newValue) {
        if (selectedTab === newValue) {
            setSelectedTab(false);
        } else {
            setSelectedTab(newValue);
        }
    }

    function handleExpandClick(event, sources) {
        const selectedSources = [...props.sources] || [];
        let index;
        if (event && event.target.checked) {
            let selectedSource = event;
            if (selectedSources.indexOf(selectedSource) <= 0) {
                selectedSources.push(selectedSource)
            } else {
                index = selectedSources.indexOf(selectedSource);
                if (index >= 0) {
                    selectedSources.splice(index, 1);
                }
            }
        } else {
            return null
        }
        setExpandedSources(selectedSources);
        updateBaseMap(Number(event.target.value), sources);
    }

    function showFootprintData(ix: number, sources) {
        if (expandedSources && selectedBaseMap === ix) {
            const source = sources[ix];
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

    const [sources, setSources] = useState([]);
    useEffect(() => {
        setSources([
            ...providers.filter(provider =>
                !provider.hidden && !!provider.preview_url && !!provider.display).map(provider => {
                let footprintsLayer;
                if (!!provider.footprint_url) {
                    footprintsLayer = {
                        mapUrl: provider.footprint_url,
                        slug: `${provider.slug}-footprints`,
                    } as MapLayer;
                }
                return {
                    footprintsLayer,
                    mapLayer: {
                        mapUrl: provider.preview_url,
                        metadata: provider.metadata,
                        slug: provider.slug,
                        copyright: provider.service_copyright,
                    } as MapLayer,
                    name: provider.name,
                    type: provider.type,
                    data_type: provider.data_type,
                    thumbnail_url: provider.thumbnail_url,
                } as BaseMapSource;
            })
        ]);
    }, [providers]);

    const drawerOpen = !!selectedTab;
    const areProvidersHidden = providers.find(provider => provider.hidden === true);


    const [ offSet, setOffSet ] = useState(0);

    const [ filteredSources, setFilteredSources ] = useState(() => sources || null);
    useEffect(() => {
        if (filteredSources === null) {
            setFilteredSources(sources || null);
        }
    }, [sources]);

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
                    </VerticalTabs>
                    <div style={{display: 'block'}} className={classes.heading}>
                        <div style={{display: 'flex'}}>
                            <strong style={{fontSize: '18px', margin: 'auto 0'}}>Basemaps</strong>
                            <Clear
                                className={classes.clear}
                                color="primary"
                                onClick={(event) => setSelectedTab(false)}

                            />
                        </div>
                        <div style={{display: 'flex'}}>
                            <strong style={{margin: 'auto 0'}}>
                                Select a basemap
                            </strong>
                            <span style={{marginLeft: 'auto', marginRight: '3px'}}>
                            <MapDrawerOptions
                                sources={sources}
                                setSources={(_sources: BaseMapSource[]) => setFilteredSources(_sources)}
                                onEnabled={() => setOffSet(100)}
                                onDisabled={() => setOffSet(0)}
                            />
                            </span>
                        </div>
                    </div>
                    <div className={classes.scrollBar} style={areProvidersHidden ? {} : {height: 'calc(100% - 100px)'}}>
                        <CustomScrollbar>
                            <div style={{height: `${offSet}px`}} />
                            <List style={{padding: '10px'}}>
                                {(filteredSources || []).map((source, ix) => (
                                        <div key={ix}>
                                            <ListItem className={`${classes.listItem} ${classes.noPadding}`}>
                                            <span style={{marginRight: '2px'}}>
                                                <Radio
                                                    checked={selectedBaseMap === ix}
                                                    value={ix}
                                                    classes={{
                                                        root: classes.checkbox, checked: classes.checked,
                                                    }}
                                                    onClick={(e) => handleExpandClick(e, sources)}
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
                                                {showFootprintData(ix, sources)}
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
                                    disabled={selectedBaseMap === -1 || (!selectedBaseMap && selectedBaseMap !== 0)}
                                    // -1 clear the map
                                    onClick={() => {
                                        updateBaseMap(-1, sources);
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                        {areProvidersHidden && <UnavailableFilterPopup/>}
                    </div>
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
