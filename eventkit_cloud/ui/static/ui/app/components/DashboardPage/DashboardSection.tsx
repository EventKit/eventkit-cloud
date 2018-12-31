import * as React from 'react';
import { withStyles, withTheme, createStyles, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import GridList from '@material-ui/core/GridList';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import SwipeableViews from 'react-swipeable-views';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    tabsRoot: {
        height: '16px',
        minHeight: '16px',
    },
    tabsIndicator: {
        display: 'none',
    },
    tabRoot: {
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        backgroundColor: theme.eventkit.colors.white,
        border: `3px solid ${theme.eventkit.colors.primary}`,
        margin: '0px 4px',
        transition: 'border 0.25s',
        minWidth: '16px',
        minHeight: '16px',
        opacity: 1,
    },
    tabSelected: {
        border: `8px solid ${theme.eventkit.colors.primary}`,
    },
    tabDisabled: {
        backgroundColor: theme.eventkit.colors.secondary_dark,
        border: `3px solid ${theme.eventkit.colors.grey}`,
        opacity: 0.5,
    },
});

export interface Props {
    className?: string;
    style?: object;
    title: string;
    name: string;
    columns: number;
    onViewAll?: () => void;
    noDataElement?: React.ReactElement<any>;
    cellHeight?: number;
    gridPadding?: number;
    rows?: number;
    rowMajor?: boolean;
    children: any;
    classes: { [name: string]: string };
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export interface State {
    pageIndex: number;
}

export class DashboardSection extends React.Component<Props, State> {
    static defaultProps = {
        style: {},
        onViewAll: undefined,
        noDataElement: undefined,
        cellHeight: undefined,
        gridPadding: 2,
        rows: 1,
        rowMajor: true,
        children: undefined,
        classes: {},
    };

    private maxPages: number;

    constructor(props: Props) {
        super(props);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.getPages = this.getPages.bind(this);
        this.state = {
            pageIndex: 0,
        };
        this.maxPages = 3;
    }

    private getPages() {
        const itemsPerPage = this.props.columns * this.props.rows;
        // Group children into pages, each of length maxPages.
        const children = React.Children.toArray(this.props.children);
        const pages = [];
        for (let i = 0; i < children.length; i += itemsPerPage) {
            pages.push(children.slice(i, i + itemsPerPage));
            if (pages.length === this.maxPages) {
                break;
            }
        }

        return pages;
    }

    handlePageChange(_, pageIndex: number) {
        this.setState({
            pageIndex,
        });
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { classes } = this.props;
        const md = isWidthUp('md', this.props.width);

        const spacing = md ? 10 : 2;
        const scrollbarWidth = 6;
        const halfGridPadding = this.props.gridPadding / 2;
        const styles = {
            root: {
                marginBottom: '35px',
                ...this.props.style,
            },
            sectionHeader: {
                margin: '12px 0 13px',
                paddingLeft: md ? `${spacing + halfGridPadding}px` : '12px',
                paddingRight: md ? `${spacing + halfGridPadding + scrollbarWidth}px` : '12px',
                fontSize: md ? '22px' : '18px',
                fontWeight: 'bold' as 'bold',
                letterSpacing: '0.6px',
                textTransform: 'uppercase' as 'uppercase',
                display: 'flex',
                alignItems: 'center',
                color: colors.white,
            },
            sectionHeaderLeft: {
                flex: '1',
            },
            sectionHeaderRight: {
                display: 'flex',
                alignItems: 'center',
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
                paddingRight: md ? `${spacing + scrollbarWidth}px` : `${spacing}px`,
            },
            viewAll: {
                color: colors.primary,
                textTransform: 'uppercase' as 'uppercase',
                fontSize: md ? '14px' : '12px',
                cursor: 'pointer',
                marginLeft: '18px',
            },
        };

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
                                    spacing={this.props.gridPadding}
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
                                spacing={this.props.gridPadding}
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
                                onChange={this.handlePageChange}
                                value={this.state.pageIndex}
                                classes={{
                                    root: classes.tabsRoot,
                                    indicator: classes.tabsIndicator,
                                }}
                            >
                                {[...Array(this.maxPages)].map((nothing, pageIndex) => (
                                    <Tab
                                        key={`DashboardSection-${this.props.name}-Tab${pageIndex}`}
                                        className="qa-DashboardSection-Tab"
                                        value={pageIndex}
                                        classes={{
                                            root: classes.tabRoot,
                                            selected: classes.tabSelected,
                                            disabled: classes.tabDisabled,
                                        }}
                                        disabled={!(pageIndex < childrenPages.length)}
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

export default withWidth()(withTheme()(withStyles(jss)(DashboardSection)));
