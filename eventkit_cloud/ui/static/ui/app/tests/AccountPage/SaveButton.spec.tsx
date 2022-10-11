import * as sinon from 'sinon';
import SaveButton from '../../components/AccountPage/SaveButton';
import { screen, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('SaveButton component', () => {
    const getProps = () => ({
        ...(global as any).eventkit_test_props,
        saved: false,
        saveDisabled: true,
        handleSubmit: sinon.spy(),
    });

    it('should render a disabled save button', () => {
        const props = getProps();
        TestUtils.renderComponent(<SaveButton {...props}/>);

        const button = screen.getByText('Save Changes').closest('button');
        expect(button).toBeDisabled();
    });

    it('should render a not disabled save button', () => {
        const props = getProps();
        props.saveDisabled = false;
        TestUtils.renderComponent(<SaveButton {...props}/>);

        const button = screen.getByText('Save Changes').closest('button');
        expect(button).not.toBeDisabled();
    });

    it('should render the "saved" button', () => {
        const props = getProps();
        props.saved = true;
        TestUtils.renderComponent(<SaveButton {...props}/>);

        expect(screen.getByText('Saved'));
    });

    it('should call handleSubmit', () => {
        const props = getProps();
        props.saveDisabled = false;
        props.handleSubmit = sinon.spy();
        TestUtils.renderComponent(<SaveButton {...props}/>);

        const button = screen.getByText('Save Changes').closest('button');
        expect(props.handleSubmit.notCalled).toBe(true);
        fireEvent.click(button);
        expect(props.handleSubmit.calledOnce).toBe(true);
    });

    it('should not call handleSubmit when disabled', () => {
        const props = getProps();
        props.handleSubmit = sinon.spy();
        TestUtils.renderComponent(<SaveButton {...props}/>);

        const button = screen.getByText('Save Changes').closest('button');
        expect(props.handleSubmit.notCalled).toBe(true);
        fireEvent.click(button);
        expect(props.handleSubmit.notCalled).toBe(true);
    });
});
