import {DropZoneError} from '../../components/MapTools/DropZoneError';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {PopupBox} from '../../components/PopupBox';
const Dropzone = require('react-dropzone');
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('DropZoneError component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            importGeom: {
                processing: false,
                processed: false,
                geom: {},
                error: null
            },
            setAllButtonsDefault: () => {},
            resetGeoJSONFile: () => {},
        }
    }

    it('should render empty div by default', () => {
        const props = getProps();
        const wrapper = mount(<DropZoneError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('div').html()).toEqual('<div></div>');
    });

    it('should render error message when new props are received', () => {
        const props = getProps();
        const wrapper = mount(<DropZoneError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        wrapper.setProps(nextProps);
        expect(wrapper.find(PopupBox)).toHaveLength(1);
        expect(wrapper.find('.container')).toHaveLength(1);
        expect(wrapper.find('.titlebar')).toHaveLength(1);
        expect(wrapper.find('.title')).toHaveLength(1);
        expect(wrapper.find('span').text()).toEqual('Error');
        expect(wrapper.find('.exit')).toHaveLength(1);
        expect(wrapper.find('.fileError')).toHaveLength(1);
        expect(wrapper.find('.fileError').text()).toEqual('An error has occured');
    });

    it('should update state when new props are received', () => {
        const props = getProps();
        const wrapper = mount(<DropZoneError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        wrapper.instance().setState = sinon.spy();
        wrapper.setProps(nextProps);
        expect(wrapper.instance().setState
            .calledWith({showErrorMessage: true, errorMessage: nextProps.importGeom.error})).toEqual(true);
    });

    it('should handle button click', () => {
        const props = getProps();
        const wrapper = mount(<DropZoneError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.importGeom.error = 'An error has occured';
        nextProps.resetGeoJSONFile = sinon.spy();
        wrapper.setProps(nextProps);
        wrapper.instance().setState = sinon.spy();
        wrapper.find('button').simulate('click');
        expect(nextProps.resetGeoJSONFile.calledOnce).toEqual(true);
        expect(wrapper.instance().setState.calledWith({showErrorMessage: false})).toEqual(true);
    })
});
