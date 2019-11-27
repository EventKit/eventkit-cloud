import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import CustomScrollbar from "../CustomScrollbar";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import {createStyles, Theme, withStyles, withTheme, Grid, Icon, Divider} from "@material-ui/core";
import {connect} from "react-redux";
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';

import RadioGroup from "@material-ui/core/RadioGroup";
import Radio from "@material-ui/core/Radio";
import {Tab, Tabs} from "@material-ui/core";
import * as PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Clear from '@material-ui/icons/Clear';


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
        backgroundColor: '#fff',
        top: 'auto',
        position: 'absolute',
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
        backgroundColor: theme.eventkit.colors.secondary,
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
        height: 'calc(100% - 100px)',
        width: '250px',
    },
    heading: {
        margin: 'auto 15px',
        fontSize: '18px',
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
        width: '32px',
        height: '32px',
    },
    checked: {},
    selected: {},
    stickyRow: {
        position: 'absolute',
        height: '50px',
        width: '100%',
        display: 'grid',
    },
    button: {
        color: theme.eventkit.colors.white,
        position: 'absolute',
        right: '10px',
        top: '10px',
    },
    thumbnail: {
        flexShrink: 0,
        height: '35px',
        width: '70px',
        marginRight: '5px',
    },
    imageIcon: {
        width: '48px',
        height: '48px',
    }
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
    url: string;
    name: string;
    type: string;
    thumbnail_url: string;
}

export interface Props {
    providers: Eventkit.Provider[];
    sources: BaseMapSource[];
    updateBaseMap: (mapId: string) => void;
    classes: { [className: string]: string };
}

export interface State {
    selectedTab: any;
    selectedBaseMap: number;
    sources: BaseMapSource[];
}

export class MapDrawer extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };
    static defaultProps = {sources: []};

    constructor(props: Props) {
        super(props);
        this.updateBaseMap = this.updateBaseMap.bind(this);

        this.state = {
            selectedTab: false,
            selectedBaseMap: -1,
            sources: [
                ...props.sources,
            ]
        };
    }

    private updateBaseMap(newBaseMapId: number, sources) {
        this.setState({selectedBaseMap: newBaseMapId});
        const baseMapUrl = (newBaseMapId !== -1) ? sources[newBaseMapId].url : '';
        this.props.updateBaseMap(baseMapUrl);
    }

    handleChange = (event, newValue) => {
        if (this.state.selectedTab === newValue) {
            this.setState({selectedTab: false});
        } else {
            this.setState({selectedTab: newValue});
        }
    };

    render() {
        const {classes} = this.props;
        const {selectedTab, selectedBaseMap} = this.state;
        const sources = [
            ...this.state.sources,
            // Filter for providers with a preview_url AND marked to display
            ...this.props.providers.filter(provider => !!provider.preview_url && !!provider.display).map(provider => {
                return {
                    url: provider.preview_url,
                    name: provider.name,
                    type: provider.type,
                    thumbnail_url: provider.thumbnail_url,
                } as BaseMapSource;
            })];
        const drawerOpen = !!selectedTab;

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
                            onChange={this.handleChange}
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
                                                src="../../../images/icn_basemap.svg"
                                                alt="Basemap"
                                                title="Basemap"
                                            />
                                        </Icon>
                                    </Card>)}
                            />
                        </VerticalTabs>
                        <div style={{display: 'flex'}}>
                            <strong className={classes.heading}>Select a basemap</strong>
                            <Clear className={classes.clear} color="primary" onClick={(event) => {
                                this.setState({selectedTab: false})
                            }}/>
                        </div>
                        <Divider style={{margin: '0 5px 0 5px'}}/>
                        <div className={classes.scrollBar}>
                            <CustomScrollbar>
                                <List style={{padding: '10px'}}>
                                    <RadioGroup
                                        value={selectedBaseMap.toString()}
                                        onChange={(e, value) => this.updateBaseMap(Number(value), sources)}
                                    >
                                        {sources.map((source, ix) =>
                                            (
                                                <div key={ix}>
                                                    <ListItem className={`${classes.listItem} ${classes.noPadding}`}>
                                                    <span style={{marginRight: '2px'}}>
                                                        <Radio
                                                            checked={this.state.selectedBaseMap === ix}
                                                            value={ix}
                                                            classes={{root: classes.checkbox, checked: classes.checked}}
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
                                                                {source.type.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </ListItem>
                                                </div>
                                            ))
                                        }
                                    </RadioGroup>
                                </List>
                            </CustomScrollbar>
                        </div>
                        <Divider style={{margin: '0 5px 0 5px'}}/>
                        <div
                            className={classes.stickyRow}
                        >
                            <Button
                                className={classes.button}
                                color="primary"
                                variant="contained"
                                disabled={selectedBaseMap === -1 || (!selectedBaseMap && selectedBaseMap !== 0)}
                                onClick={() => {
                                    // Send empty string to clear base map url.
                                    this.updateBaseMap(-1, sources);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </Drawer>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        providers: state.providers,
    };
}

export default (withStyles<any, any>(jss)(connect(mapStateToProps)(MapDrawer)));
