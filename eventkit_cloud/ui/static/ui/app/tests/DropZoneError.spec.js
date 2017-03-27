import {DropZoneError} from '../components/DropZoneError';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {PopupBox} from '../components/PopupBox';
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
        expect(wrapper.find('div')).to.have.length(1);
        expect(wrapper.find('div').html()).to.equal('<div></div>');
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
        expect(wrapper.find(PopupBox)).to.have.length(1);
        expect(wrapper.find('.container')).to.have.length(1);
        expect(wrapper.find('.titlebar')).to.have.length(1);
        expect(wrapper.find('.title')).to.have.length(1);
        expect(wrapper.find('span').text()).to.equal('Error');
        expect(wrapper.find('.exit')).to.have.length(1);
        expect(wrapper.find('.fileError')).to.have.length(1);
        expect(wrapper.find('.fileError').text()).to.equal('An error has occured');
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
            .calledWith({showErrorMessage: true, errorMessage: nextProps.importGeom.error})).to.equal(true);
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
        expect(nextProps.resetGeoJSONFile.calledOnce).to.equal(true);
        expect(wrapper.instance().setState.calledWith({showErrorMessage: false})).to.equal(true);
    })
});
