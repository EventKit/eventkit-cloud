import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import CustomScrollbar from "../CustomScrollbar";
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import {withStyles, withTheme} from "@material-ui/core";
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
}

export interface State {
    tab: number;
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
        this.state = {
            tab: 0,
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

    render() {
        const styles = {
            containerStyle: {
                backgroundColor: '#fff',
                top: 'auto',
                position: 'absolute' as 'absolute',
                overflowY: 'hidden' as 'hidden',
                overflowX: 'hidden' as 'hidden',
                width: '250px',
                right: '0px',
                left: 'auto',
                visibility: this.state.open ? 'visible' as 'visible' : 'hidden' as 'hidden',
                height: '100%',
            },
        };

        const {tab} = this.state;
        const providers = this.props.providers.filter(provider => !!provider.preview_url);

        return (
            <div
                style={{
                    height: 'calc(100vh - 180px)',
                    right: '0px',
                    position: 'absolute',
                    width: '250px',
                }}
            >
                <Paper
                    style={{border: '1px black'}}
                    square={true}
                >
                    <strong>BASEMAPS</strong>
                    <ButtonBase
                        style={{height: '30px'}}
                        onClick={() => {
                            this.setState({open: !this.state.open});
                        }}
                    >
                        <ArrowDropDownIcon
                        />
                    </ButtonBase>
                </Paper>
                <Drawer
                    hidden={tab !== 0}
                    className="qa-MapDrawer-Drawer"
                    variant="persistent"
                    anchor="top"
                    open={this.state.open}
                    PaperProps={{style: styles.containerStyle}}
                >
                    <CustomScrollbar>
                        <div style={{marginBottom: '10px', marginTop: '10px'}}><strong>Select a basemap</strong></div>
                        <List>
                            <RadioGroup
                                onChange={(e, value) => this.props.updateBaseMap(value)}
                            >
                                {providers.map((provider, ix) =>
                                    (
                                        <div key={ix}>
                                            <Divider/>
                                            <ListItem>
                                                <FormControlLabel
                                                    value={provider.preview_url}
                                                    control={<Radio/>}
                                                    label={provider.name}
                                                />
                                            </ListItem>
                                        </div>
                                    ))
                                }
                                <Divider/>
                            </RadioGroup>
                        </List>
                    </CustomScrollbar>
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

export default (connect(mapStateToProps)(MapDrawer));
