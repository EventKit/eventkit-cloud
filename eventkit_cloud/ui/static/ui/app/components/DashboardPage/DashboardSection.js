/* eslint react/no-array-index-key: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import { GridList, Tab, Tabs } from 'material-ui';
import SwipeableViews from 'react-swipeable-views';

export class DashboardSection extends React.Component {
    constructor(props) {
        super(props);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.getPages = this.getPages.bind(this);
        this.state = {
            pageIndex: 0,
        };
        this.maxPages = 3;
        this.itemsPerPage = this.props.columns * this.props.rows;
    }

    getPages() {
        // Group children into pages, each of length maxPages.
        const children = React.Children.toArray(this.props.children);
        const pages = [];
        for (let i = 0; i < children.length; i += this.itemsPerPage) {
            pages.push(children.slice(i, i + this.itemsPerPage));
            if (pages.length === this.maxPages) {
                break;
            }
        }

        return pages;
    }

    handlePageChange(pageIndex) {
        this.setState({
            pageIndex,
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
                opacity: '0.5',
            },
        };

        const tabButtonBorderStyle = selected => (
            selected ? '8px solid rgb(69, 152, 191)' : '3px solid rgb(69, 152, 191)'
        );

        const childrenPages = this.getPages();

        let view = null;
        if (childrenPages.length > 0) {
            // swipe here
            view = (
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
                                    className="qa-DashboardSection-Page-Item"
                                >
                                    {child}
                                </div>
                            ));
                        } else {
                            // For column-major layouts, create an inner single-column GridList for each column, so
                            // that items each column gets filled completely before adding to the next one.
                            const childrenColumns = [];
                            let column = [];

                            childrenPage.forEach((child) => {
                                column.push(child);
                                if (column.length >= this.props.rows) {
                                    // Filled the column. Onto the next one.
                                    childrenColumns.push(column);
                                    column = [];
                                }
                            });

                            // Partial column at the end.
                            if (column.length > 0) {
                                childrenColumns.push(column);
                            }

                            content = childrenColumns.map((childrenColumn, columnIndex) => (
                                <GridList
                                    key={`DashboardSection-${this.props.name}-Page${pageIndex}-Column${columnIndex}`}
                                    className="qa-DashboardSection-Page-Column"
                                    cellHeight={this.props.cellHeight || 'auto'}
                                    padding={this.props.gridPadding}
                                    cols={1}
                                >
                                    {childrenColumn.map((child, index) => (
                                        <div
                                            key={`DashboardSection-${this.props.name}-Page${pageIndex}-Column${columnIndex}-Item${index}`}
                                            className="qa-DashboardSection-Page-Item"
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
                                className="qa-DashboardSection-Page"
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
            );
        } else if (this.props.noDataElement) {
            view = this.props.noDataElement;
        }

        return (
            <div
                style={styles.root}
                id={`DashboardSection${this.props.title}`}
                className={`qa-DashboardSection-${this.props.title}`}
            >
                <div
                    className="qa-DashboardSection-Header"
                    style={styles.sectionHeader}
                >
                    <div
                        className="qa-DashboardSection-Header-Title"
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
                                {[...Array(this.maxPages)].map((nothing, pageIndex) => (
                                    <Tab
                                        key={`DashboardSection-${this.props.name}-Tab${pageIndex}`}
                                        className="qa-DashboardSection-Tab"
                                        value={pageIndex}
                                        style={(pageIndex < childrenPages.length) ? styles.tab : styles.tabDisabled}
                                        disableTouchRipple
                                        buttonStyle={(pageIndex < childrenPages.length) ?
                                            {
                                                ...styles.tabButton,
                                                border: tabButtonBorderStyle(pageIndex === this.state.pageIndex),
                                            }
                                            :
                                            styles.tabButtonDisabled
                                        }
                                    />
                                ))}
                            </Tabs>
                            {this.props.onViewAll ?
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="qa-DashboardSection-ViewAll"
                                    style={styles.viewAll}
                                    onClick={this.props.onViewAll}
                                    onKeyPress={this.props.onViewAll}
                                >
                                    View All
                                </span>
                                :
                                null
                            }
                        </div>
                        :
                        null
                    }
                </div>
                {view}
            </div>
        );
    }
}

DashboardSection.propTypes = {
    style: PropTypes.object,
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    columns: PropTypes.number.isRequired,
    onViewAll: PropTypes.func,
    noDataElement: PropTypes.element,
    cellHeight: PropTypes.number,
    gridPadding: PropTypes.number,
    rows: PropTypes.number,
    rowMajor: PropTypes.bool,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
        PropTypes.string,
    ]),
};

DashboardSection.defaultProps = {
    style: {},
    onViewAll: undefined,
    noDataElement: undefined,
    cellHeight: undefined,
    gridPadding: 2,
    rows: 1,
    rowMajor: true,
    children: undefined,
};

export default DashboardSection;
