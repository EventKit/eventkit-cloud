import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import TextField from 'material-ui/TextField';
import DataPackSearchbar from '../../components/DataPackPage/DataPackSearchbar';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('DataPackSearchbar component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            onSearchChange: () => {},
            onSearchSubmit: () => {},
        }
    }

    const getWrapper = (props) => {
        return mount(<DataPackSearchbar {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }

    it('should render the TextField component', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find('.qa-DataPackSearchBar-TextField')).toHaveLength(1);
        expect(wrapper.find('.qa-DataPackSearchBar-TextField').children().first().text()).toEqual('Search DataPacks');
    });

    it('should call handleChange', () => {
        const props = getProps();
        const e = {target: {value: 'Search Text'}};
        const changeSpy = new sinon.spy(DataPackSearchbar.prototype, 'handleChange');
        const wrapper = getWrapper(props);
        expect(changeSpy.called).toBe(false);
        wrapper.find('input').simulate('change', e);
        expect(changeSpy.calledOnce).toBe(true);
        expect(changeSpy.args[0][1]).toEqual('Search Text');
    });

    it('should call handleKeyDown', () => {
        const props = getProps();
        const change = {target: {value: 'Search Text'}};
        const enter = {keyCode: 13, which: 13, key: 'enter'};
        const keySpy = new sinon.spy(DataPackSearchbar.prototype, 'handleKeyDown');
        const wrapper = getWrapper(props);
        expect(keySpy.calledOnce).toBe(false);
        wrapper.find('input').simulate('change', change);
        wrapper.find('input').simulate('keyDown', enter);
        expect(keySpy.calledOnce).toBe(true);
    });

    it('handleKeyDown should call onSearchSubmit if key is Enter', () => {
        const props = getProps();
        props.onSearchSubmit = new sinon.spy();
        const wrapper = getWrapper(props);
        const e = {key: 'Enter', target: {value: 'search text'}};
        wrapper.instance().handleKeyDown(e);
        expect(props.onSearchSubmit.calledOnce).toBe(true);
        expect(props.onSearchSubmit.calledWith('search text')).toBe(true);
    });

    it('handleKeyDown should call onSearchSubmit with empty string if there is no value', () => {
        const props = getProps();
        props.onSearchSubmit = new sinon.spy();
        const wrapper = getWrapper(props);
        const e = {key: 'Enter', target: {value: null}};
        wrapper.instance().handleKeyDown(e);
        expect(props.onSearchSubmit.calledOnce).toBe(true);
        expect(props.onSearchSubmit.calledWith('')).toBe(true);
    });

    it('handleChange should call onSearchChange', () => {
        const props = getProps();
        props.onSearchChange = new sinon.spy();
        const wrapper = getWrapper(props);
        const e = {target: {value: 'search text'}};
        wrapper.instance().handleChange(e, 'search text');
        expect(props.onSearchChange.calledOnce).toBe(true);
        expect(props.onSearchChange.calledWith('search text')).toBe(true);
    });

    it('handleChanger should call onSearchChange with empty string', () => {
        const props = getProps();
        props.onSearchChange = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleChange(null, null);
        expect(props.onSearchChange.calledOnce).toBe(true);
        expect(props.onSearchChange.calledWith('')).toBe(true);
    });
});
