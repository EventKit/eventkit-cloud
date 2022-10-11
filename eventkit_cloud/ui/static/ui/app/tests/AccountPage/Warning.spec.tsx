import { Warning } from '../../components/AccountPage/Warning';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('Warning component', () => {
    it('should display a div with the passed in text', () => {
        TestUtils.renderComponent(<Warning text="this is some text" />);
        expect(screen.getByText('this is some text'));
    });

    it('should display div with a passed in <p> element with text', () => {
        TestUtils.renderComponent(<Warning text={<p>passed in node</p>} />);
        expect(screen.getByText('passed in node'));
    });

    it('should apply the right inline styles to the div', () => {
        const expectedStyles = {
            backgroundColor: '#f8e6dd',
            width: '100%',
            margin: '5px 0px',
            lineHeight: '25px',
            padding: '16px',
            textAlign: 'center',
        };
        TestUtils.renderComponent(<Warning text="blah blah" />);
        expect(screen.getByText("blah blah")).toHaveStyle(expectedStyles);
    });
});
