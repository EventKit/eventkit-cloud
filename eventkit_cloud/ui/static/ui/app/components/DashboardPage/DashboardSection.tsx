import * as React from 'react';
import { withStyles, withTheme, createStyles, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import ImageList from '@material-ui/core/ImageList';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import SwipeableViews from 'react-swipeable-views';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { useState } from "react";

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
        padding: 0,
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

export const DashboardSection = (props: Props) => {
    let maxPages: number = 3;
    const [pageIndex, setPageIndex] = useState(0);
    const rows = props.rows ?? 1;
    const rowMajor = props.rowMajor ?? true;
    const gridPadding = props.gridPadding ?? 2;

    const getPages = () => {
        const itemsPerPage = props.columns * rows;
        // Group children into pages, each of length maxPages.
        const children = React.Children.toArray(props.children);
        const pages = [];
        for (let i = 0; i < children.length; i += itemsPerPage) {
            pages.push(children.slice(i, i + itemsPerPage));
            if (pages.length === maxPages) {
                break;
            }
        }

        return pages;
    };

    const handlePageChange = (_, pageIndex: number) => {
        setPageIndex(pageIndex);
    };

    const { colors } = props.theme.eventkit;
    const { classes } = props;
    const md = isWidthUp('md', props.width);

    const spacing = md ? 10 : 2;
    const scrollbarWidth = 6;
    const halfGridPadding = gridPadding / 2;
    const styles = {
        root: {
            marginBottom: '35px',
            ...props.style,
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

    const childrenPages = getPages();

    let view = null;
    if (childrenPages.length > 0) {
        // swipe here
        view = (
            <SwipeableViews
                style={styles.swipeableViews}
                index={pageIndex}
                onChangeIndex={handlePageChange}
            >
                {childrenPages.map((childrenPage, pageIndex) => {
                    let content;
                    if (rowMajor) {
                        content = childrenPage.map((child, index) => (
                            <div
                                key={`DashboardSection-${props.name}-Page${pageIndex}-Item${index}`}
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
                            if (column.length >= rows) {
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
                            <ImageList
                                key={`DashboardSection-${props.name}-Page${pageIndex}-Column${columnIndex}`}
                                className="qa-DashboardSection-Page-Column"
                                rowHeight={props.cellHeight || 'auto'}
                                gap={gridPadding}
                                cols={1}
                            >
                                {childrenColumn.map((child, index) => (
                                    <div
                                        key={`DashboardSection-${props.name}-Page${pageIndex}-Column${columnIndex}-Item${index}`}
                                        className="qa-DashboardSection-Page-Item"
                                    >
                                        {child}
                                    </div>
                                ))}
                            </ImageList>
                        ));
                    }

                    return (
                        <ImageList
                            key={`DashboardSection-${props.name}-Page${pageIndex}`}
                            className="qa-DashboardSection-Page"
                            rowHeight={props.cellHeight || 'auto'}
                            style={styles.gridList}
                            gap={gridPadding}
                            cols={props.columns}
                        >
                            {content}
                        </ImageList>
                    );
                })}
            </SwipeableViews>
        );
    } else if (props.noDataElement) {
        view = props.noDataElement;
    }

    return (
        <div
            style={styles.root}
            id={`DashboardSection${props.title}`}
            className={`qa-DashboardSection-${props.title}`}
        >
            <div
                className="qa-DashboardSection-Header"
                style={styles.sectionHeader}
            >
                <div
                    className="qa-DashboardSection-Header-Title"
                    style={styles.sectionHeaderLeft}
                >
                    {props.title}
                </div>
                {(childrenPages.length > 0) ?
                    <div style={styles.sectionHeaderRight}>
                        <Tabs
                            onChange={handlePageChange}
                            value={pageIndex}
                            classes={{
                                root: classes.tabsRoot,
                                indicator: classes.tabsIndicator,
                            }}
                            data-testid={"tabsList"}
                        >
                            {[...Array(maxPages)].map((nothing, pageIndex) => (
                                <Tab
                                    key={`DashboardSection-${props.name}-Tab${pageIndex}`}
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
                        {props.onViewAll ?
                            <span
                                role="button"
                                tabIndex={0}
                                className="qa-DashboardSection-ViewAll"
                                style={styles.viewAll}
                                onClick={props.onViewAll}
                                onKeyPress={props.onViewAll}
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
};

export default withWidth()(withTheme(withStyles(jss)(DashboardSection)));
