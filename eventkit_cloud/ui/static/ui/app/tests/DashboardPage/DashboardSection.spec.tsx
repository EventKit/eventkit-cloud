import * as sinon from 'sinon';
import { screen, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';
import { DashboardSection } from '../../components/DashboardPage/DashboardSection';

describe('DashboardSection component', () => {
    function defaultProps() {
        return {
            title: 'Test',
            name: 'test',
            columns: 3,
            providers: [],
            noDataElement: <div className="qa-DashboardSection-NoDataElement" />,
            classes: {},
            theme: {
                eventkit: {
                    images: {},
                    colors: {}
                }
            },
            ...(global as any).eventkit_test_props,
            width: {},
        };
    }

    function generateChildren(count) {
        const children = [];
        for (let i = 0; i < count; i += 1) {
            children.push(<div className="qa-DashboardSection-Child" />);
        }

        return children;
    }

    it('renders header title', () => {
        const props = {
            ...defaultProps(),
        };
        TestUtils.renderComponent(<DashboardSection {...props} />);
        expect(screen.getByText(props.title));
    });

    it('limits the number of pages to maxPages', () => {
        const props = {
            ...defaultProps(),
            columns: 1,
            rows: 1,
        };
        const children = generateChildren(10);
        TestUtils.renderComponent(
            <DashboardSection {...props}>
                {children}
            </DashboardSection>
        );
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
    });

    it('updates the page index on a page change', () => {
        const props = {
            ...defaultProps(),
            columns: 3,
            rows: 2,
        };
        const children = generateChildren(8);
        TestUtils.renderComponent(
            <DashboardSection {...props}>
                {children}
            </DashboardSection>
        );
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        fireEvent.click(tabs[1]);
        expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    describe('no children', () => {
        it('renders "no data" element', () => {
            const props = {
                ...defaultProps(),
            };
            const component = TestUtils.renderComponent(<DashboardSection {...props} />, { includeToastContainer: false });
            expect(component.container.children).toHaveLength(1);
        });
    });

    describe('3 columns, 3 children (1 page)', () => {
        beforeEach(() => {
            const props = {
                ...defaultProps(),
                columns: 3,
            };
            const children = generateChildren(3);
            TestUtils.renderComponent(
                <DashboardSection {...props}>
                    {children}
                </DashboardSection>
            );
        });

        it('renders 3 tab buttons (maxPages = 3)', () => {
            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(3);
        });

        it('enables the first tab button', () => {
            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(3);
            expect(tabs[0]).toHaveAttribute("aria-selected", "true");
            expect(tabs[1]).toHaveAttribute("aria-selected", "false");
            expect(tabs[2]).toHaveAttribute("aria-selected", "false");
        });
    });

    describe('when onViewAll handler is not passed in',  () => {
        it('does not render "View All" button',  () => {
            const props = {
                ...defaultProps(),
            };
            const children = generateChildren(3);
            TestUtils.renderComponent(
                <DashboardSection {...props}>
                    {children}
                </DashboardSection>
            );
            expect(screen.queryByText('View All')).toBeNull();
        });
    });

    describe('when onViewAll handler is passed in', () => {
        const props = {
            ...defaultProps(),
            onViewAll: sinon.spy(),
        };
        beforeEach(() => {
            const children = generateChildren(1);
            TestUtils.renderComponent(
                <DashboardSection {...props}>
                    {children}
                </DashboardSection>
            );
        });

        it('renders "View All" button', () => {
            expect(screen.getByText('View All'));
        });

        it('calls onViewAll() when "View All" button is clicked', () => {
            const all = screen.getByText('View All');
            expect(all);
            fireEvent.click(all);
            expect(props.onViewAll.callCount).toBe(1);
        });
    });
});
