import React, { PropTypes } from 'react';
import { GridList, Tab, Tabs } from 'material-ui';
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
        const spacing = window.innerWidth > 575 ? 10 : 2;
        const scrollbarWidth = 6;
        const halfGridPadding = this.props.gridPadding / 2;
        let styles = {
            root: {
                marginBottom: '35px',
                ...this.props.style,
            },
            sectionHeader: {
                margin: '12px 0 13px',
                paddingLeft: (window.innerWidth > 575) ? `${spacing + halfGridPadding}px` : '12px',
                paddingRight: (window.innerWidth > 575) ? `${spacing + halfGridPadding + scrollbarWidth}px` : '12px',
                fontSize: (window.innerWidth > 575) ? '22px' : '18px',
                fontWeight: 'bold',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
            },
            sectionHeaderLeft: {
                flex: '1',
            },
            sectionHeaderRight: {
                display: 'flex',
                alignItems: 'center',
            },
            tabButtonsContainer: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
            },
            tabButton: {
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                border: '3px solid rgb(69, 152, 191)',
                margin: '0',
                transition: 'border 0.25s',
            },
            tab: {
                width: 'auto',
                margin: '0 4px',
                padding: '0 4px',
            },
            swipeableViews: {
                width: '100%',
            },
            gridList: {
                border: '1px',
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: `${spacing}px`,
                paddingRight: (window.innerWidth > 575) ? `${spacing + scrollbarWidth}px` : `${spacing}px`,
            },
            viewAll: {
                color: 'rgb(69, 152, 191)',
                textTransform: 'uppercase',
                fontSize: (window.innerWidth > 575) ? '14px' : '12px',
                cursor: 'pointer',
                marginLeft: '18px',
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
            return selected ? '8px solid rgb(69, 152, 191)' : '3px solid rgb(69, 152, 191)';
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
            <div style={styles.root}>
                <div
                    className={'qa-DashboardSection-Header'}
                    style={styles.sectionHeader}
                >
                    <div
                        className={'qa-DashboardSection-Header-Title'}
                        style={styles.sectionHeaderLeft}
                    >
                        {this.props.title}
                    </div>
                    {(childrenPages.length > 0) ?
                        <div style={styles.sectionHeaderRight}>
                            <Tabs
                                tabItemContainerStyle={styles.tabButtonsContainer}
                                inkBarStyle={{ display: 'none' }}
                                onChange={this.handlePageChange}
                                value={this.state.pageIndex}
                            >
                                {[...Array(maxPages)].map((nothing, pageIndex) => (
                                    <Tab
                                        key={`DashboardSection-${this.props.name}-Tab${pageIndex}`}
                                        className={'qa-DashboardSection-Tab'}
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
                            {this.props.onViewAll ?
                                <a
                                    className={'qa-DashboardSection-ViewAll'}
                                    style={styles.viewAll}
                                    onClick={this.props.onViewAll}
                                >
                                    View All
                                </a>
                                :
                                null
                            }
                        </div>
                        :
                        null
                    }
                </div>
                {(childrenPages.length === 0) ?
                    this.props.noDataElement ?
                        this.props.noDataElement
                        :
                        null
                    :
                    <SwipeableViews
                        style={styles.swipeableViews}
                        index={this.state.pageIndex}
                        onChangeIndex={this.handlePageChange}
                    >
                        {childrenPages.map((childrenPage, pageIndex) => {
                            let content;
                            if (this.props.rowMajor) {
                                content = childrenPage.map((child, index) => (
                                    <div
                                        key={`DashboardSection-${this.props.name}-Page${pageIndex}-Item${index}`}
                                        className={'qa-DashboardSection-Page-Item'}
                                    >
                                        {child}
                                    </div>
                                ))
                            } else {
                                // For column-major layouts, create an inner single-column GridList for each column, so
                                // that items each column gets filled completely before adding to the next one.
                                const childrenColumns = [];
                                let column = [];
                                for (let child of childrenPage) {
                                    column.push(child);
                                    if (column.length >= this.props.rows) {
                                        // Filled the column. Onto the next one.
                                        childrenColumns.push(column);
                                        column = [];
                                    }
                                }

                                // Partial column at the end.
                                if (column.length > 0) {
                                    childrenColumns.push(column);
                                }

                                content = childrenColumns.map((childrenColumn, columnIndex) => (
                                    <GridList
                                        key={`DashboardSection-${this.props.name}-Page${pageIndex}-Column${columnIndex}`}
                                        className={'qa-DashboardSection-Page-Column'}
                                        cellHeight={this.props.cellHeight || 'auto'}
                                        padding={this.props.gridPadding}
                                        cols={1}
                                    >
                                        {childrenColumn.map((child, index) => (
                                            <div
                                                key={`DashboardSection-${this.props.name}-Page${pageIndex}-Column${columnIndex}-Item${index}`}
                                                className={'qa-DashboardSection-Page-Item'}
                                            >
                                                {child}
                                            </div>
                                        ))}
                                    </GridList>
                                ));
                            }

                            return (
                                <GridList
                                    key={`DashboardSection-${this.props.name}-Page${pageIndex}`}
                                    className={'qa-DashboardSection-Page'}
                                    cellHeight={this.props.cellHeight || 'auto'}
                                    style={styles.gridList}
                                    padding={this.props.gridPadding}
                                    cols={this.props.columns}
                                >
                                    {content}
                                </GridList>
                            );
                        })}
                    </SwipeableViews>
                }
            </div>
        )
    }
}

DashboardSection.propTypes = {
    style: PropTypes.object,
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    columns: PropTypes.number.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    onViewAll: PropTypes.func,
    noDataElement: PropTypes.element,
    cellHeight: PropTypes.number,
    gridPadding: PropTypes.number,
    rows: PropTypes.number,
    rowMajor: PropTypes.bool,
};

DashboardSection.defaultProps = {
    style: {},
    onViewAll: undefined,
    noDataElement: undefined,
    cellHeight: undefined,
    gridPadding: 2,
    rows: 1,
    rowMajor: true,
};

export default DashboardSection;
