import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import {Tab, Tabs, Typography} from "@material-ui/core";;
import AoiInfobar from "./AoiInfobar";
import {MapQueryDisplay} from "./MapQueryDisplay";
import {SelectedBaseMap} from "./CreateExport";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    wrapper: {
        zIndex: 2,
        position: 'absolute',
        height: '200px',
        width: '100%',
        bottom: '100px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        [theme.breakpoints.only('xs')]: {
            justifyContent: 'start',
        },
    },
    infobar: {
        backgroundColor: 'none',
        margin: '0px 70px',
        pointerEvents: 'auto',
        [theme.breakpoints.only('sm')]: {
            margin: '0px 10px 0px 70px',
        },
    },
    large: {
        display: 'flex',
    },
    hidden: {
        display: 'none',
    }
});

const StyledTabs = withStyles({
    root: {
        minHeight: "auto",
        padding: 0,
    }
})(Tabs);

const tabJss = (theme: Eventkit.Theme & Theme) => createStyles({
    root: {
        opacity: '1.0',
        fontSize: '14px',
        minHeight: "auto",
        padding: 0,
        borderTopRightRadius: '4px',
        borderTopLeftRadius: '4px',
        backgroundColor: theme.eventkit.colors.primary,
        color: theme.eventkit.colors.secondary,
        '&> span > span': {
            padding: '5px',
        },
    },
    selected: {
        boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)',
        backgroundColor: theme.eventkit.colors.white,
        color: theme.eventkit.colors.primary,
    }
});

const StyledTab = withStyles(tabJss, {withTheme: true})(Tab);

export interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    aoiInfoBarProps: any;
    setRef: (ref: any) => void;
    classes: { [className: string]: string };
    selectedBaseMap: SelectedBaseMap;
}

export interface State {
    selectedTab: any;
    infoBarOpen: boolean;
    queryBoxVisible: boolean;
}

enum TabNum {
    AoiInfo=1,
    PoiInfo=2,
}

export class MapDisplayBar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            selectedTab: false,
            infoBarOpen: false,
            queryBoxVisible: false,
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        const { aoiInfoBarProps } = this.props;
        const { infoBarOpen, queryBoxVisible, selectedTab } = this.state;
        const prevInfoBarOpen = prevState.infoBarOpen;
        const prevQueryBoxVisible = prevState.queryBoxVisible;
        const prevAoiInfoProps = prevProps.aoiInfoBarProps;

        const currentCount = Object.keys(aoiInfoBarProps.aoiInfo.geojson).length;
        if (currentCount !== Object.keys(prevAoiInfoProps.aoiInfo.geojson).length) {
            if (currentCount === 0) {
                if (infoBarOpen) {
                    this.setState({infoBarOpen: false});
                }
            } else {
                if (!infoBarOpen) {
                    this.setState({infoBarOpen: true});
                }
            }
        }

        if (!selectedTab || (prevInfoBarOpen !== infoBarOpen || prevQueryBoxVisible !== queryBoxVisible)) {
            if (infoBarOpen) {
                this.setState({selectedTab: TabNum.AoiInfo})
            } else if (queryBoxVisible) {
                this.setState({selectedTab: TabNum.PoiInfo})
            }
        }
    }

    handleChange = (event, newValue) => {
        if (this.state.selectedTab !== newValue) {
            this.setState({selectedTab: newValue});
        }
    };

    render() {
        const { classes } = this.props;
        const aoiTabVisible = this.state.infoBarOpen;
        const poiTabVisible = this.state.queryBoxVisible;
        const { selectedTab } = this.state;

        return (
            <div className={`qa-MapDisplayBar`}>
                <div className={classes.wrapper} style={{bottom: (aoiTabVisible && poiTabVisible) ? '80px' : '40px',}}>
                    {isWidthUp('sm', this.props.width) &&
                    <div className={`qa-qa-MapDisplayBar-container ${classes.infobar} ${classes.large}`}>
                        <AoiInfobar
                            {...this.props.aoiInfoBarProps}
                        />
                        < MapQueryDisplay
                            style={{ height: '150px' }}
                            maxHeight={185}
                            // Passes a ref up to ExportAOI to hook in the click event to our query function.
                            ref={child => {
                                this.props.setRef(child)
                            }}
                            selectedBaseMap={this.props.selectedBaseMap}
                        />
                    </div>
                    }
                    {!isWidthUp('sm', this.props.width) &&
                    <div className={`qa-qa-MapDisplayBar-container ${classes.infobar}`}>
                        {(aoiTabVisible && poiTabVisible) &&
                        <StyledTabs
                            value={(selectedTab) ? selectedTab : false}
                            onChange={this.handleChange}
                        >
                            <StyledTab
                                className={`${(!aoiTabVisible) ? classes.hidden : ''}`}
                                value={TabNum.AoiInfo}
                                label="AOI Info"
                            />
                            <StyledTab
                                className={`${(!poiTabVisible) ? classes.hidden : ''}`}
                                value={TabNum.PoiInfo}
                                label="POI Info"
                            />
                        </StyledTabs>
                        }
                        <div
                            style={{
                                display: (selectedTab === TabNum.AoiInfo) ? 'flex' : 'none',
                                backgroundColor: this.props.theme.eventkit.colors.white,
                                width: 'max-content',
                            }}
                        >
                            <AoiInfobar
                                displayTitle={!poiTabVisible}
                                {...this.props.aoiInfoBarProps}
                            />
                        </div>
                        <div
                            style={{
                                display: (selectedTab === TabNum.PoiInfo) ? 'flex' : 'none',
                                backgroundColor: this.props.theme.eventkit.colors.white,
                                width: 'max-content',
                            }}
                        >
                            <MapQueryDisplay
                                style={{ height: '150px' }}
                                maxHeight={185}
                                ref={child => {
                                    this.props.setRef(child)
                                }}
                                selectedBaseMap={this.props.selectedBaseMap}
                                setVisibility={(visibility) => {
                                    this.setState({ queryBoxVisible: visibility })
                                }}
                            />
                        </div>
                    </div>
                    }
                </div>
            </div>
        );
    }
}

export default withWidth()(withStyles(jss, { withTheme: true })(MapDisplayBar));
