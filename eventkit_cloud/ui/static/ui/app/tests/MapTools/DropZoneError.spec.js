import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DropZoneError } from '../../components/MapTools/DropZoneError';

describe('DropZoneError component', () => {
    const getProps = () => ({
        importGeom: {
            processing: false,
            processed: false,
            geom: {},
            error: null,
        },
        setAllButtonsDefault: () => {},
        resetGeoJSONFile: () => {},
    });

    const getWrapper = props => mount(<DropZoneError {...props} />);

    it('should render error message when new props are received', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        wrapper.setProps(nextProps);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const children = mount(wrapper.find(BaseDialog).props().children);
        expect(children.find('.qa-DropZoneError-error')).toHaveLength(1);
        expect(children.find('.qa-DropZoneError-error').text()).toEqual('An error has occured');
    });

    it('should update state when new props are received', () => {
        const props = getProps();
        props.setAllButtonsDefault = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        wrapper.instance().setState = sinon.spy();
        wrapper.setProps(nextProps);
        expect(wrapper.instance().setState
            .calledWith({ showErrorMessage: true, errorMessage: nextProps.importGeom.error })).toEqual(true);
        expect(props.setAllButtonsDefault.calledOnce).toBe(true);
    });

    it('should not update state if new props have no error', () => {
        const props = getProps();
        props.importGeom.error = 'oh no an error';
        props.setAllButtonsDefault = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.importGeom.error = '';
        wrapper.instance().setState = sinon.spy();
        wrapper.setProps(nextProps);
        expect(props.setAllButtonsDefault.called).toBe(false);
        expect(wrapper.instance().setState.called).toBe(false);
    });

    it('handleErrorClear should setState and resetGeoJSONFile', () => {
        const props = getProps();
        props.resetGeoJSONFile = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().setState = sinon.spy();
        wrapper.instance().handleErrorClear();
        expect(props.resetGeoJSONFile.calledOnce).toBe(true);
        expect(wrapper.instance().setState.calledOnce).toBe(true);
        expect(wrapper.instance().setState.calledWith({ showErrorMessage: false })).toBe(true);
    });
});
