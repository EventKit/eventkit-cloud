import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DropZoneError } from '../../components/MapTools/DropZoneError';

jest.mock('../../components/Dialog/BaseDialog', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line
    return (props) => (<div id="basedialog">{props.children}</div>);
});

describe('DropZoneError component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        importGeom: {
            processing: false,
            processed: false,
            geom: {},
            error: null,
        },
        setAllButtonsDefault: () => {},
        resetGeoJSONFile: () => {},
        ...global.eventkit_test_props,
    });

    const getWrapper = (props) => shallow(<DropZoneError {...props} />);

    it('should render error message when new props are received', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        wrapper.setProps(nextProps);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const children = wrapper.find(BaseDialog).children();
        expect(children.find('.qa-DropZoneError-error')).toHaveLength(1);
        expect(children.find('.qa-DropZoneError-error').text()).toEqual('An error has occured');
    });

    it('should update state when new props are received', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        nextProps.setAllButtonsDefault = sinon.spy();
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({
            showErrorMessage: true,
            errorMessage: nextProps.importGeom.error,
        })).toEqual(true);
        expect(nextProps.setAllButtonsDefault.calledOnce).toBe(true);
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
