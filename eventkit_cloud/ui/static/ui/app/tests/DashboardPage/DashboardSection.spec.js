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

    function generateChildren(columns, rows) {
        const children = [];
        for (let i = 0; i < columns * rows; i++) {
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
        const wrapper = getShallowWrapper(props, generateChildren(props.columns, 1));
        expect(wrapper.find('.qa-DashboardSection-Header')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-Header-Title')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-Header-Title').text()).toBe(props.title);
        expect(wrapper.find('.qa-DashboardSection-Page')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-ViewAll')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-ViewAll').text()).toBe('View All');
        expect(wrapper.find(Tabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(3);
        expect(wrapper.find(SwipeableViews)).toHaveLength(1);
    });

    it('should show "noDataElement" if no children are provided', () => {
        const props = {
            ...getProps(),
            noDataElement: <div className={'qa-DashboardSection-NoDataElement'} />,
        };
        const wrapper = getShallowWrapper(props, []);
        expect(wrapper.find('.qa-DashboardSection-NoDataElement')).toHaveLength(1);
    });

    it('should update the page index on a page change', () => {
        const wrapper = getShallowWrapper();
        wrapper.instance().handlePageChange(1);
        expect(wrapper.state().pageIndex).toBe(1);
    });

    it('should display child elements', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns, 1));
        expect(wrapper.find('.qa-DashboardSection-Child')).toHaveLength(props.columns);
    });

    it('should break children into pages', () => {
        const pages = 3;
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns * pages, 1));
        expect(wrapper.find('.qa-DashboardSection-Page')).toHaveLength(pages);
    });

    it('should display children in a row-major grid', () => {
        const props = {
            ...getProps(),
            rowMajor: true,
            rows: 3,
        };
        const wrapper = getShallowWrapper(props, generateChildren(props.columns, props.rows));
        expect(wrapper.find('.qa-DashboardSection-Page-Column')).toHaveLength(0);
    });

    it('should display children in a column-major grid', () => {
        const props = {
            ...getProps(),
            rowMajor: false,
            rows: 3,
        };
        const wrapper = getShallowWrapper(props, generateChildren(props.columns, props.rows));
        expect(wrapper.find('.qa-DashboardSection-Page-Column')).toHaveLength(props.columns);
    });

    it('should disable tab buttons for empty pages', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns, 1));
        expect(wrapper.find('.qa-DashboardSection-Tab').get(1).props.style).toHaveProperty('pointerEvents', 'none');
        expect(wrapper.find('.qa-DashboardSection-Tab').get(2).props.style).toHaveProperty('pointerEvents', 'none');
    });

    it('should enable tab buttons for pages with content', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props, generateChildren(props.columns * 3, 1));
        expect(wrapper.find('.qa-DashboardSection-Tab').get(0).props.style).not.toHaveProperty('pointerEvents', 'none');
        expect(wrapper.find('.qa-DashboardSection-Tab').get(1).props.style).not.toHaveProperty('pointerEvents', 'none');
        expect(wrapper.find('.qa-DashboardSection-Tab').get(2).props.style).not.toHaveProperty('pointerEvents', 'none');
    });

    it('should not display "View All" button when a handler is not provided', () => {
        const wrapper = getShallowWrapper(getProps(), generateChildren(1, 1));
        expect(wrapper.find('.qa-DashboardSection-ViewAll')).toHaveLength(0);
    });
});
