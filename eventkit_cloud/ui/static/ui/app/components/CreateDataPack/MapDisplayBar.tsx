import * as React from 'react';
import { Theme, withStyles, createStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import {Divider, Icon, Tab, Tabs, Typography} from "@material-ui/core";
import Card from "@material-ui/core/Card";

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
        margin: '0px 60px',
        pointerEvents: 'auto',
        [theme.breakpoints.only('sm')]: {
            margin: '0px 10px 0px 70px',
        },
    },
    large: {
        display: 'flex',
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
    small: {
        display: 'none',
        [theme.breakpoints.down('sm')]: {
            display: 'block',
        },
    },
    hidden: {
        display: 'none',
    }
});

const StyledTabs = withStyles({
    root: {
        minHeight: "auto",
        padding: 0
    }
})(Tabs);

const tabJss = (theme: Eventkit.Theme & Theme) => createStyles({
    root: {
        opacity: '1.0',
        fontSize: '18px',
        minHeight: "auto",
        padding: 0,
        backgroundColor: theme.eventkit.colors.secondary,
        '&> span > span': {
            padding: '5px',
        },
    },
    selected: {
        backgroundColor: theme.eventkit.colors.white,
    }
});

const StyledTab = withStyles(tabJss, {withTheme: true})(Tab);

export interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    aoiInfo: any;
    queryDisplayRef: any;
    classes: { [className: string]: string };
}

export interface State {
    selectedTab: any;
    infoBarOpen: boolean;
}

export class MapDisplayBar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            selectedTab: false,
            infoBarOpen: false,
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        const { aoiInfo } = this.props;
        const { infoBarOpen } = this.state;
        const prevAoiInfo = prevProps.aoiInfo;

        const currentCount = Object.keys(aoiInfo.geojson).length;
        if (currentCount !== Object.keys(prevAoiInfo.geojson).length) {
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
    }

    handleChange = (event, newValue) => {
        if (this.state.selectedTab !== newValue) {
            this.setState({selectedTab: newValue});
        }
    };

    render() {
        const { queryDisplayRef, classes } = this.props;
        const aoiTabVisible = this.state.infoBarOpen;
        const poiTabVisible = (!!queryDisplayRef) ? queryDisplayRef.isQueryBoxVisible() : false;
        const { selectedTab } = this.state;

        return (
            <div className={`qa-MapDisplayBar`}>
                <div className={classes.wrapper}>
                    <div className={`qa-qa-MapDisplayBar-container ${classes.infobar} ${classes.large}`}>
                        {this.props.children}
                    </div>
                    { (aoiTabVisible || poiTabVisible) &&
                        <div className={`qa-qa-MapDisplayBar-container ${classes.infobar} ${classes.small}`}>
                            <StyledTabs
                                value={(selectedTab) ? selectedTab : false}
                                onChange={this.handleChange}
                            >
                                <StyledTab
                                    className={`${(!aoiTabVisible) ? classes.hidden : ''}`}
                                    value={1}
                                    label="AOI Info"
                                />
                                <StyledTab
                                    className={`${(!poiTabVisible) ? classes.hidden : ''}`}
                                    value={2}
                                    label="POI Info"
                                />
                            </StyledTabs>
                            {
                                React.Children.map(this.props.children, (child, ix) => {
                                    return (
                                        <div
                                            className={"tab" + ix}
                                            key={`tab${ix}`}
                                            style={{
                                                display: (ix + 1 === selectedTab) ? 'flex' : 'none',
                                                backgroundColor: this.props.theme.eventkit.colors.white,
                                                width: 'max-content',
                                            }}
                                        >
                                            {child}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default withWidth()(withStyles(jss, { withTheme: true })(MapDisplayBar));
