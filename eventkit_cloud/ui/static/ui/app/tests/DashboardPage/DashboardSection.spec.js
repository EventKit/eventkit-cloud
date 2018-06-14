import React from 'react';
import { shallow } from 'enzyme';
import DashboardSection from '../../components/DashboardPage/DashboardSection';
import { Tab, Tabs } from 'material-ui';
import SwipeableViews from 'react-swipeable-views';

describe('DashboardSection component', () => {
    function getProps() {
        return {
            title: 'Test',
            name: 'test',
            columns: 3,
            providers: [],
        }
    }

    function getShallowWrapper(props = getProps(), children = []) {
        return shallow(
            <DashboardSection {...props}>
                {children}
            </DashboardSection>
        );
    }

    function generateChildren(count) {
        const children = [];
        for (let i = 0; i < count; i++) {
            children.push(<div className={'qa-DashboardSection-Child'} />);
        }

        return children;
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().pageIndex).toBe(0);
    });

    it('should render the basic elements', () => {
        const props = {
            ...getProps(),
            onViewAll: () => {},
        };
        const wrapper = getShallowWrapper(props, generateChildren(props.columns));
        const instance = wrapper.instance();
        // Header
        expect(wrapper.find('.qa-DashboardSection-Header')).toHaveLength(1);
        const headerTitle = wrapper.find('.qa-DashboardSection-Header-Title');
        expect(headerTitle).toHaveLength(1);
        expect(headerTitle.text()).toBe(props.title);
        expect(wrapper.find('.qa-DashboardSection-Page')).toHaveLength(1);
        // Tabs
        const tabs = wrapper.find(Tabs);
        expect(tabs).toHaveLength(1);
        expect(tabs.props().onChange).toBe(instance.handlePageChange);
        expect(tabs.props().value).toBe(instance.state.pageIndex);
        const tabButtons = wrapper.find(Tab);
        expect(tabButtons).toHaveLength(instance.maxPages);
        const pages = instance.getPages();
        expect(pages.length).toBe(1);
        for (let i = 0; i < instance.maxPages; i++) {
            const tabButton = tabButtons.at(i);
            expect(tabButton.props().value).toBe(i);
            expect(tabButton.props().disableTouchRipple).toBe(true);
        }
        // View All
        const viewAll = wrapper.find('.qa-DashboardSection-ViewAll');
        expect(viewAll).toHaveLength(1);
        expect(viewAll.props().onClick).toBe(instance.props.onViewAll);
        expect(viewAll.text()).toBe('View All');
        // SwipeableViews
        const swipeableViews = wrapper.find(SwipeableViews);
        expect(swipeableViews).toHaveLength(1);
        expect(swipeableViews.props().index).toBe(instance.state.pageIndex);
        expect(swipeableViews.props().onChangeIndex).toBe(instance.handlePageChange);
        expect(wrapper.find('.qa-DashboardSection-Page-Item')).toHaveLength(pages[0].length);
    });

    it('should show "noDataElement" if no children are provided', () => {
        const props = {
            ...getProps(),
            noDataElement: <div className={'qa-DashboardSection-NoDataElement'} />,
        };
        const wrapper = getShallowWrapper(props, []);
        expect(wrapper.find('.qa-DashboardSection-NoDataElement')).toHaveLength(1);
    });

    it('should get the correct number of pages, each with the correct number of children', () => {
        let props = getProps();
        props = {
            ...props,
            columns: 3,
            rows: 2,
        };
        const wrapper = getShallowWrapper(props, generateChildren(8));
        const instance = wrapper.instance();
        expect(instance.maxPages).toBe(3);
        expect(instance.itemsPerPage).toBe(instance.props.columns * instance.props.rows);
        const pages = instance.getPages();
        expect(pages).toHaveLength(2);
        expect(pages[0]).toHaveLength(6);
        expect(pages[1]).toHaveLength(2);
    });

    it('should limit pages to maxPages', () => {
        let props = getProps();
        props = {
            ...props,
            columns: 2,
            rows: 1,
        };
        const wrapper = getShallowWrapper(props, generateChildren(20));
        const instance = wrapper.instance();
        const pages = instance.getPages();
        expect(pages).toHaveLength(instance.maxPages);
        expect(wrapper.find('.qa-DashboardSection-Page-Item')).toHaveLength(instance.itemsPerPage * instance.maxPages);
    });

    it('should update the page index on a page change', () => {
        const wrapper = getShallowWrapper();
        wrapper.instance().handlePageChange(1);
        expect(wrapper.state().pageIndex).toBe(1);
    });

    it('should display child elements', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns));
        expect(wrapper.find('.qa-DashboardSection-Child')).toHaveLength(props.columns);
    });

    it('should display children in a row-major grid', () => {
        const props = {
            ...getProps(),
            rowMajor: true,
            rows: 3,
        };
        const wrapper = getShallowWrapper(props, generateChildren(props.columns * props.rows));
        expect(wrapper.find('.qa-DashboardSection-Page-Column')).toHaveLength(0);
    });

    it('should display children in a column-major grid', () => {
        const props = {
            ...getProps(),
            rowMajor: false,
            rows: 3,
        };
        const wrapper = getShallowWrapper(props, generateChildren(props.columns * props.rows));
        expect(wrapper.find('.qa-DashboardSection-Page-Column')).toHaveLength(props.columns);
    });

    it('should disable tab buttons for empty pages', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns));
        const tabButtons = wrapper.find(Tab);
        expect(tabButtons.at(1).props().style).toHaveProperty('pointerEvents', 'none');
        expect(tabButtons.at(2).props().style).toHaveProperty('pointerEvents', 'none');
    });

    it('should enable tab buttons for pages with content', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns * 3));
        const tabButtons = wrapper.find(Tab);
        expect(tabButtons.at(0).props().style).not.toHaveProperty('pointerEvents', 'none');
        expect(tabButtons.at(1).props().style).not.toHaveProperty('pointerEvents', 'none');
        expect(tabButtons.at(2).props().style).not.toHaveProperty('pointerEvents', 'none');
    });

    it('should not display "View All" button when a handler is not provided', () => {
        const wrapper = getShallowWrapper(getProps(), generateChildren(1));
        expect(wrapper.find('.qa-DashboardSection-ViewAll')).toHaveLength(0);
    });
});
