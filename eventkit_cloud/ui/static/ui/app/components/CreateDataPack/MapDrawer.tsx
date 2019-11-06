import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import CustomScrollbar from "../CustomScrollbar";
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import {createStyles, Theme, withStyles, withTheme, Grid} from "@material-ui/core";
import {connect} from "react-redux";
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';
import DropDown from '@material-ui/icons/ArrowDropDown';
import Close from '@material-ui/icons/Close';

import RadioGroup from "@material-ui/core/RadioGroup";
import Radio from "@material-ui/core/Radio";
import {Tab, Tabs} from "@material-ui/core";
import * as PropTypes from "prop-types";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        zIndex: 4,
        right: '0px',
        position: 'absolute',
        width: '100%',
        minWidth: '200px',
        maxWidth: '250px',
    },
    drawerPaper: {
        backgroundColor: '#fff',
        top: 'auto',
        position: 'absolute',
        overflowY: 'hidden',
        overflowX: 'hidden',
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
    tabs: {
        width: '100%',
    },
    tabHeader: {
        display: 'flex',
        right: '0px',
        top: '0',
        position: 'absolute',
        marginTop: '2px',
        height: '100%',
        paddingLeft: '2px',
    },
    tab: {
        backgroundColor: 'lightGrey',
        color: 'black',
        '&$selected': {
            backgroundColor: theme.eventkit.colors.secondary,
            color: theme.eventkit.colors.primary,
        }
    },
    scrollBar: {
        height: 'calc(100% - 100px)',
        width: '250px',
    },
    subHeading: {
        marginBottom: '10px',
        marginTop: '5px',
        marginLeft: '10px',
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
    }
});

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
            selectedTab: '',
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

    getIcon = (tabName) => {
        const {selectedTab} = this.state;
        const containerStyle = {height: '40px', width: '40px', display: 'flex'};
        if (selectedTab === tabName) {
            return (
                <div style={containerStyle}>
                    <Close
                        style={{margin: 'auto'}}
                    />
                </div>);
        } else {
            return (
                <div style={containerStyle}>
                    <DropDown
                        style={{margin: 'auto', height: '40px', width: '40px'}}
                        color="primary"
                    />
                </div>);
        }
    };

    render() {
        const {classes} = this.props;
        const {selectedTab, selectedBaseMap} = this.state;
        const sources = [
            ...this.state.sources,
            ...this.props.providers.filter(provider => !!provider.preview_url).map(provider => {
                return {
                    url: provider.preview_url,
                    name: provider.name,
                    type: provider.type,
                    thumbnail_url: provider.thumbnail_url,
                } as BaseMapSource;
            })];

        return (
            <div
                className={classes.container}
            >
                <Paper
                    style={{
                        height: 'auto',
                    }}
                    square={true}
                >
                    <Tabs
                        className={classes.tabs}
                        value={(selectedTab) ? selectedTab : false}
                        onChange={this.handleChange}
                        variant="fullWidth"
                    >
                        <Tab
                            value="basemap"
                            classes={{
                                root: classes.tab,
                                selected: classes.selected,
                            }}
                            label={(
                                <Card className={classes.tabHeader}>
                                    <strong
                                        style={{fontSize: '18px', color: 'secondary', margin: 'auto 0'}}
                                    >
                                        BASEMAPS
                                    </strong>
                                    {this.getIcon('basemap')}
                                </Card>)}
                        />
                    </Tabs>
                </Paper>
                <Drawer
                    className="qa-MapDrawer-Drawer"
                    variant="persistent"
                    anchor="right"
                    open={selectedTab === 'basemap'}
                    PaperProps={{
                        className: classes.drawerPaper,
                        style: {visibility: selectedTab === 'basemap' ? 'visible' as 'visible' : 'hidden' as 'hidden'},
                    }}
                >
                    <div className={classes.scrollBar}>
                        <CustomScrollbar>
                            <div className={classes.subHeading}><strong>Select a basemap</strong></div>
                            <List style={{paddingRight: '10px', paddingLeft: '10px'}}>
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
                                                        {/*<div className={classes.buttonLabelSecondary}>*/}
                                                        {/*    {source.type.toUpperCase()}*/}
                                                        {/*</div>*/}
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
        );
    }
}

function mapStateToProps(state) {
    return {
        providers: state.providers,
    };
}

export default (withStyles<any, any>(jss)(connect(mapStateToProps)(MapDrawer)));
