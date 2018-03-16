import React, { PropTypes } from 'react';
import { GridList, Tab, Tabs } from 'material-ui';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackWideItem from './DataPackWideItem';
import SwipeableViews from 'react-swipeable-views';

export class DashboardSection extends React.Component {
    constructor(props) {
        super(props);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.state = {
            pageIndex: 0,
        }
    }

    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    handlePageChange(pageIndex) {
        this.setState({
            pageIndex: pageIndex,
        });
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        let styles = {
            sectionHeader: {
                margin: '12px 0 13px',
                paddingLeft: '13px',
                fontSize: '27px',
                fontWeight: 'bold',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
            },
            tabButtonsContainer: {
                position: 'absolute',
                height: '35px',
                top: '-46px',
                right: '-50px',
                width: '200px',
                backgroundColor: 'rgba(0, 0, 0, 0)',
            },
            tabButton: {
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                border: '3px solid rgb(68, 152, 192)',
                margin: '0',
                transition: 'border 0.25s',
            },
            tab: {
                width: 'auto',
                margin: '0 4px',
                padding: '0 4px',
            },
            tabContent: {
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            swipeableViews: {
                width: '100%',
            },
            gridList: {
                border: '1px',
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
            },
        };

        // Inherited styles.
        styles = {
            ...styles,
            tabDisabled: {
                ...styles.tab,
                pointerEvents: 'none',
            },
            tabButtonDisabled: {
                ...styles.tabButton,
                backgroundColor: 'lightgray',
                border: '3px solid gray',
            },
        };

        const tabButtonBorderStyle = (selected) => {
            return selected ? '8px solid rgb(68, 152, 192)' : '3px solid rgb(68, 152, 192)';
        };

        let cellHeight = 'auto';
        if (this.props.wide && this.props.itemHeight) {
            cellHeight = this.props.itemHeight;
        }

        return (
            <div style={this.props.style}>
                <div
                    className={`qa-DashboardSection-${this.props.name}Header`}
                    style={styles.sectionHeader}
                >
                    {this.props.title}
                </div>
                {this.props.dataPackPages.length === 0 ?
                    <div className={`qa-DashboardSection-${this.props.name}-NoData`}>{this.props.noDataMessage}</div>
                    :
                    <div>
                        <Tabs
                            style={{position: 'relative', width: '100%'}}
                            tabItemContainerStyle={styles.tabButtonsContainer}
                            inkBarStyle={{display: 'none'}}
                            onChange={this.handlePageChange}
                            value={this.state.pageIndex}
                        >
                            {[...Array(3)].map((nothing, pageIndex) => (
                                <Tab
                                    key={`${this.props.name}Tab${pageIndex}`}
                                    value={pageIndex}
                                    style={(pageIndex < this.props.dataPackPages.length) ? styles.tab : styles.tabDisabled}
                                    disableTouchRipple={true}
                                    buttonStyle={(pageIndex < this.props.dataPackPages.length) ?
                                        {
                                            ...styles.tabButton,
                                            border: tabButtonBorderStyle(pageIndex === this.state.pageIndex)
                                        }
                                        :
                                        styles.tabButtonDisabled
                                    }
                                >
                                </Tab>
                            ))}
                        </Tabs>
                        <SwipeableViews
                            style={styles.swipeableViews}
                            index={this.state.pageIndex}
                            onChangeIndex={this.handlePageChange}
                        >
                            {this.props.dataPackPages.map((page, pageIndex) => (
                                <GridList
                                    key={`${this.props.name}GridList${pageIndex}`}
                                    className={`qa-DashboardSection-${this.props.name}Grid`}
                                    cellHeight={cellHeight}
                                    style={styles.gridList}
                                    padding={this.getGridPadding()}
                                    cols={this.props.columns}
                                >
                                    {page.map((run, index) => (
                                        this.props.wide ?
                                            <DataPackWideItem
                                                className={`qa-DashboardSection-${this.props.name}Grid-WideItem`}
                                                run={run}
                                                user={this.props.user}
                                                key={run.created_at}
                                                providers={this.props.providers}
                                                gridName={this.props.name}
                                                index={index}
                                                height={(this.props.itemHeight) ? `${this.props.itemHeight}px` : 'auto'}
                                            />
                                            :
                                            <DataPackGridItem
                                                className={`qa-DashboardSection-${this.props.name}Grid-Item`}
                                                run={run}
                                                user={this.props.user}
                                                key={run.created_at}
                                                onRunDelete={this.props.deleteRuns}
                                                providers={this.props.providers}
                                                gridName={this.props.name}
                                                index={index}
                                                showFeaturedFlag={false}
                                            />
                                    ))}
                                </GridList>
                            ))}
                        </SwipeableViews>
                    </div>
                }
            </div>
        )
    }
}

DashboardSection.propTypes = {
    user: PropTypes.object.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    dataPackPages: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    columns: PropTypes.number.isRequired,
    deleteRuns: PropTypes.func,
    noDataMessage: PropTypes.string,
    wide: PropTypes.bool,
    itemHeight: PropTypes.number,
    style: PropTypes.object,
};

DashboardSection.defaultProps = {
    wide: false,
};

export default DashboardSection;
