import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import CustomScrollbar from "../CustomScrollbar";
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import {createStyles, Theme, withStyles, withTheme} from "@material-ui/core";
import {connect} from "react-redux";
import {ExportSummary} from "./ExportSummary";
import ButtonBase from "@material-ui/core/ButtonBase";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import RadioGroup from "@material-ui/core/RadioGroup";
import Radio from "@material-ui/core/Radio";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import * as PropTypes from "prop-types";
import Paper from "@material-ui/core/Paper";
import Checkbox from "@material-ui/core/Checkbox";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        zIndex: 4,
        height: 'calc(100vh - 180px)',
        right: '0px',
        position: 'absolute',
        width: '250px',
    },
    drawerPaper: {
        backgroundColor: '#fff',
        top: 'auto',
        position: 'absolute',
        overflowY: 'hidden',
        overflowX: 'hidden',
        width: '250px',
        right: '0px',
        left: 'auto',
        height: '100%',
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
    scrollBar: {
        height: 'calc(100% - 75px)',
        width: '250px',
    },
    subHeading: {
        marginBottom: '10px',
        marginTop: '5px',
        marginLeft: '10px',
    },
    listItem: {
        padding: '0',
        marginBottom: '8px',
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
    button: {
        color: theme.eventkit.colors.white,
    },
});

// This should be used to facilitate user added base map sources (sources not derived from providers)
export interface BaseMapSource {
    url: string;
    name: string;
    type: string;
}

export interface Props {
    open: boolean;
    providers: Eventkit.Provider[];
    sources: BaseMapSource[];
    updateBaseMap: (mapUrl: string) => void;
    classes: { [className: string]: string };
}

export interface State {
    selectedBaseMap: string;
    open: boolean;
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
            selectedBaseMap: undefined,
            open: true,
            sources: [
                ...props.sources,
                // Map providers into base map sources
                ...props.providers.filter(provider => !!provider.preview_url).map(provider => {
                    return {
                        url: provider.preview_url,
                        name: provider.name,
                        type: provider.type,
                    };
                })
            ]
        };
    }

    private updateBaseMap(newBaseMapUrl: string) {
        this.setState({selectedBaseMap: newBaseMapUrl});
        this.props.updateBaseMap(newBaseMapUrl);
    }

    render() {
        const {classes} = this.props;
        const {selectedBaseMap} = this.state;
        const sources = [
            ...this.state.sources,
            ...this.props.providers.filter(provider => !!provider.preview_url).map(provider => {
                return {
                    url: provider.preview_url,
                    name: provider.name,
                    type: provider.type,
                } as BaseMapSource;
            })];
        if (sources.length > 0) {
            let x = [] as BaseMapSource[];
            for (let i = 0; i < 25; ++i) {
                const source = {...sources[0]};
                source.url = source.url + 'cvbnxcvbcvb' + i;
                source.name = source.name + 'dfghdfghdfghdghdgfghdgfhdhjhgjfghjffghjfghd dghdhdhdghdfghdf gdfghdfhdfgh' + i;
                x.push(source);
            }
            sources.push(...x);
        }
        return (
            <div
                className={classes.container}
            >
                <Paper
                    style={{
                        paddingLeft: '10px',
                        height: '30px',
                    }}
                    square={true}
                >
                    <div style={{height: '30px', right: '0px', position: 'absolute'}}>
                        <strong>BASEMAPS</strong>
                        <ButtonBase
                            onClick={() => {
                                this.setState({open: !this.state.open});
                            }}
                        >
                            <ArrowDropDownIcon
                                color="primary"
                            />
                        </ButtonBase>
                    </div>
                </Paper>
                <Drawer
                    className="qa-MapDrawer-Drawer"
                    variant="persistent"
                    anchor="right"
                    open={this.state.open}
                    PaperProps={{
                        className: classes.drawerPaper,
                        style: {visibility: this.state.open ? 'visible' as 'visible' : 'hidden' as 'hidden'},
                    }}
                >
                    <div className={classes.scrollBar}>
                    <CustomScrollbar>
                        <div className={classes.subHeading}><strong>Select a basemap</strong></div>
                        <List style={{paddingRight: '10px', paddingLeft: '10px'}}>
                            <RadioGroup
                                value={(!!selectedBaseMap) ? selectedBaseMap : undefined}
                                onChange={(e, value) => this.updateBaseMap(value)}
                            >
                                {sources.map((source, ix) =>
                                    (
                                        <div key={ix}>
                                            <ListItem className={classes.listItem}>
                                                <Radio
                                                    checked={this.state.selectedBaseMap === source.url}
                                                    value={source.url}
                                                    classes={{root: classes.checkbox, checked: classes.checked}}
                                                />
                                                <ListItemText
                                                    className={classes.listItem}
                                                    disableTypography
                                                    primary={
                                                        <Typography
                                                            className={classes.buttonLabel}
                                                        >
                                                            {source.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography
                                                            className={classes.buttonLabelSecondary}
                                                        >
                                                            {source.type.toUpperCase()}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                            {/*<Divider/>*/}
                                        </div>
                                    ))
                                }
                            </RadioGroup>
                        </List>
                    </CustomScrollbar>
                    </div>
                    <Paper
                        square={true}
                        style={{bottom: '25px', position: 'absolute', height: '50px', width: '100%'}}
                    >
                        <Button
                            className={classes.button}
                            color="primary"
                            variant="contained"
                            onClick={() => {
                                // Send empty string to clear base map url.
                                this.updateBaseMap('');
                            }}
                        >
                            Reset
                        </Button>
                    </Paper>
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

export default withStyles<any, any>(jss)(connect(mapStateToProps)(MapDrawer));
