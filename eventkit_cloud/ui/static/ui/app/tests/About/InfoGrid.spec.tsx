import { InfoGrid, Props } from '../../components/About/InfoGrid';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('InfoGrid component', () => {
    const getProps = (): Props => ({
        ...(global as any).eventkit_test_props,
        title: 'Test Header',
        items: [
            { title: 'item 1', body: 'body 1' },
            { title: 'item 2', body: 'body 2' },
        ],
    });

    it('should render a header and GridList with passed in items', () => {
        const props = getProps();
        TestUtils.renderComponent(<InfoGrid {...props} />);

        expect(screen.getByText('Test Header'));
        expect(screen.getByText('item 1:'));
        expect(screen.getByText('item 2:'));
    });

    it('should apply passed in style props',() => {
        const props = getProps();
        props.titleStyle = { color: 'red' };
        props.itemStyle = { color: 'blue' };
        TestUtils.renderComponent(<InfoGrid {...props} />);

        const titleHeader = screen.getByText('Test Header').closest('h3');
        const titleStyle = window.getComputedStyle(titleHeader);
        expect(titleStyle.color).toBe('red')

        const item = screen.getByText('item 1:').closest('li');
        const itemStyle = window.getComputedStyle(item);
        expect(itemStyle.color).toBe('blue');
    });
});
