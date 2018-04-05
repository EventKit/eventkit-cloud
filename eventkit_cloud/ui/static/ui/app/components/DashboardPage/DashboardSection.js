import React, { PropTypes } from 'react';
import { GridList, Paper, Tab, Tabs } from 'material-ui';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackWideItem from './DataPackWideItem';
import SwipeableViews from 'react-swipeable-views';

export class DashboardSection extends React.Component {
    constructor(props) {
        super(props);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.state = {
            pageIndex: 0,
        }
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

        const maxPages = 3;
        const itemsPerPage = this.props.columns * this.props.rows;
        const childrenPages = [];
        const children = React.Children.toArray(this.props.children);
        for (let i = 0; i < children.length; i += itemsPerPage) {
            childrenPages.push(children.slice(i, i + itemsPerPage));
            if (childrenPages.length === maxPages) {
                break;
            }
        }

        return (
            <div style={this.props.style}>
                <div
                    className={`qa-DashboardSection-${this.props.name}Header`}
                    style={styles.sectionHeader}
                >
                    {this.props.title}
                </div>
                {(childrenPages.length === 0) ?
                    this.props.noDataElement ?
                        this.props.noDataElement
                        :
                        null
                    :
                    <div>
                        <Tabs
                            style={{position: 'relative', width: '100%'}}
                            tabItemContainerStyle={styles.tabButtonsContainer}
                            inkBarStyle={{display: 'none'}}
                            onChange={this.handlePageChange}
                            value={this.state.pageIndex}
                        >
                            {[...Array(maxPages)].map((nothing, pageIndex) => (
                                <Tab
                                    key={`${this.props.name}Tab${pageIndex}`}
                                    value={pageIndex}
                                    style={(pageIndex < childrenPages.length) ? styles.tab : styles.tabDisabled}
                                    disableTouchRipple={true}
                                    buttonStyle={(pageIndex < childrenPages.length) ?
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
                            {childrenPages.map((childrenPage, pageIndex) => (
                                <GridList
                                    key={`${this.props.name}GridList${pageIndex}`}
                                    className={`qa-DashboardSection-${this.props.name}Grid`}
                                    cellHeight={this.props.cellHeight || 'auto'}
                                    style={styles.gridList}
                                    padding={this.props.gridPadding}
                                    cols={this.props.columns}
                                >
                                    {childrenPage.map((child, index) => (
                                        <div key={`DashboardSection-${this.props.name}Grid-Item${index}Container`}>
                                            {child}
                                        </div>
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
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    columns: PropTypes.number.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    noDataElement: PropTypes.element,
    cellHeight: PropTypes.number,
    gridPadding: PropTypes.number,
    rows: PropTypes.number,
    style: PropTypes.object,
};

DashboardSection.defaultProps = {
    rows: 1,
    style: { marginBottom: '35px' },
    gridPadding: 2,
};

export default DashboardSection;
