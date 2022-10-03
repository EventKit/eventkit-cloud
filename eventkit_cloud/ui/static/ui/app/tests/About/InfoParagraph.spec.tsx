import { InfoParagraph, Props } from '../../components/About/InfoParagraph';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('InfoParagraph component', () => {
    const getProps = (): Props => ({
        ...(global as any).eventkit_test_props,
        title: 'Test Header',
        body: 'Test Body',
    });

    it('should render a header and body with passed in text', () => {
        const props = getProps();
        TestUtils.renderComponent(<InfoParagraph {...props} />);
        expect(screen.getByText('Test Header'));
        expect(screen.getByText('Test Body'));
    });

    it('should apply passed in style props', () => {
        const props = getProps();
        props.titleStyle = { color: 'red' };
        props.bodyStyle = { color: 'blue' };
        TestUtils.renderComponent(<InfoParagraph {...props} />);

        const titleHeader = screen.getByText('Test Header').closest('h3');
        const titleStyle = window.getComputedStyle(titleHeader);
        expect(titleStyle.color).toBe('red');

        const body = screen.getByText('Test Body');
        const bodyStyle = window.getComputedStyle(body);
        expect(bodyStyle.color).toBe('blue');
    });
});
