import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '@material-ui/core/TextField';
import { DataPackSearchbar } from '../../components/DataPackPage/DataPackSearchbar';

describe('DataPackSearchbar component', () => {
    const getProps = () => ({
        onSearchChange: sinon.spy(),
        onSearchSubmit: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackSearchbar {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the TextField component', () => {
        expect(wrapper.find(TextField)).toHaveLength(1);
    });

    it('handleKeyDown should call onSearchSubmit if key is Enter', () => {
        const e = { key: 'Enter', target: { value: 'search text' } };
        instance.handleKeyDown(e);
        expect(props.onSearchSubmit.calledOnce).toBe(true);
        expect(props.onSearchSubmit.calledWith('search text')).toBe(true);
    });

    it('handleKeyDown should call onSearchSubmit with empty string if there is no value', () => {
        const e = { key: 'Enter', target: { value: null } };
        instance.handleKeyDown(e);
        expect(props.onSearchSubmit.calledOnce).toBe(true);
        expect(props.onSearchSubmit.calledWith('')).toBe(true);
    });

    it('handleChange should call onSearchChange', () => {
        const e = { target: { value: 'search text' } };
        instance.handleChange(e, 'search text');
        expect(props.onSearchChange.calledOnce).toBe(true);
        expect(props.onSearchChange.calledWith('search text')).toBe(true);
    });

    it('handleChange should call onSearchChange with empty string', () => {
        instance.handleChange({ target: { value: '' } });
        expect(props.onSearchChange.calledOnce).toBe(true);
        expect(props.onSearchChange.calledWith('')).toBe(true);
    });
});
