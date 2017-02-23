import {AoiInfobar} from '../components/AoiInfobar';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';

describe('AoiInfobar component', () => {
    const getProps = () => {
        return {
            aoiInfo: {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
            },
            zoomToSelection: {
                disabled: true,
                click: false
            },
            resetMap: {
                disabled: true,
                click: false
            },
            toggleZoomToSelection: (bool) => {},
            clickZoomToSelection: () => {},
            toggleResetMap: (bool) => {},
            clickResetMap: () => {},
        }
    };

    const geojson = { "type": "FeatureCollection",
    "features": [
      { "type": "Feature",
         "geometry": {
           "type": "Polygon",
           "coordinates": [
             [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
               [100.0, 1.0], [100.0, 0.0] ]
             ]
         },}]};

    it('should not display the infobar by default', () => {
        let props = getProps();
        const wrapper = mount(<AoiInfobar {...props}/>);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find('aoiInfobar')).to.have.length(0);
    });

    // it('should display the default topbar information',() => {
    //     let props = getProps();
    //     const wrapper = mount(<AoiInfobar {...props}/>);
        
    // });

    // it('should display the default detailbar information', () => {
    //     let props = getProps();
    //     const wrapper = mount(<AoiInfobar {...props}/>);
    //     expect(wrapper.find('.detailBar')).to.have.length(1);
    //     expect(wrapper.find('i')).to.have.length(3);
    //     expect(wrapper.find('i').last().text()).to.equal('warning');
    //     expect(wrapper.find('.detailText')).to.have.length(1);
    //     expect(wrapper.find('.aoiTitle').text()).to.equal('');
    //     expect(wrapper.find('.aoiDescription').text()).to.equal('No AOI Set');
    // });

    it('should handle aoiInfo update', () => {
        let props = getProps();
        props.toggleResetMap = sinon.spy();
        props.toggleZoomToSelection = sinon.spy()
        const wrapper = mount(<AoiInfobar {...props}/>);
        let nextProps = getProps();
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        wrapper.setProps(nextProps);

        expect(wrapper.find('div')).to.have.length(8);
        expect(wrapper.find('.aoiInfoWrapper')).to.have.length(1);
        expect(wrapper.find('.topBar')).to.have.length(1);
        expect(wrapper.find('.aoiInfoTitle').text()).to.equal('Area Of Interest (AOI)');
        expect(wrapper.find('.simpleButton .inactiveButton')).to.have.length(2);
        expect(wrapper.find('.simpleButton').first().text()).to.equal(' ZOOM TO SELECTION');
        expect(wrapper.find('.simpleButton').last().text()).to.equal(' RESET VIEW');
        expect(wrapper.find('.fa-search-plus')).to.have.length(1);
        expect(wrapper.find('.fa-refresh')).to.have.length(1);

        expect(wrapper.find('.aoiTitle').text()).to.equal('fake title');
        expect(wrapper.find('.aoiDescription').text()).to.equal('fake description');
        expect(wrapper.find('.material-icons').first().text()).to.equal('crop_square');
        expect(props.toggleResetMap.calledWith(false)).to.equal(true);
        expect(props.toggleZoomToSelection.calledWith(false)).to.equal(true);
    });

    it('should handle zoomToSelection state update', () => {
        let props = getProps();
        const wrapper = mount(<AoiInfobar {...props}/>);
        let nextProps = getProps();
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        nextProps.zoomToSelection.disabled = false;
        wrapper.instance().updateZoomToSelectionState = sinon.spy(wrapper.instance(), 'updateZoomToSelectionState');
        wrapper.setProps(nextProps);
        expect(wrapper.instance().updateZoomToSelectionState.calledOnce).to.equal(true);
        expect(wrapper.find('.simpleButton .activeButton')).to.have.length(1);
    });

    it('should handle resetMap state update', () => {
        let props = getProps();
        const wrapper = mount(<AoiInfobar {...props}/>);
        let nextProps = getProps();
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        nextProps.resetMap.disabled = false;
        wrapper.instance().updateResetMapState = sinon.spy(wrapper.instance(), 'updateResetMapState');
        wrapper.setProps(nextProps);
        expect(wrapper.instance().updateResetMapState.calledOnce).to.equal(true);
        expect(wrapper.find('.simpleButton .activeButton')).to.have.length(1);
    });


    // it('clicking on disabled buttons should do nothing', () => {
    //     let props = getProps();
    //     props.clickResetMap = sinon.spy();
    //     props.clickZoomToSelection = sinon.spy();
    //     const wrapper = mount(<AoiInfobar {...props}/>);
    //     wrapper.find('.simpleButton').first().simulate('click');
    //     wrapper.find('.simpleButton').last().simulate('click');
    //     expect(props.clickZoomToSelection.calledOnce).to.equal(false);
    //     expect(props.clickResetMap.calledOnce).to.equal(false);
    // });

    it('clicking on active buttons should execute click functions', () => {
        let props = getProps();
        const wrapper = mount(<AoiInfobar {...props}/>);
        let nextProps = getProps();
        nextProps.clickResetMap = sinon.spy();
        nextProps.clickZoomToSelection = sinon.spy();
        nextProps.zoomToSelection.disabled = false,
        nextProps.resetMap.disabled = false,
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        wrapper.setProps(nextProps);
        wrapper.find('.simpleButton').first().simulate('click');
        wrapper.find('.simpleButton').last().simulate('click');
        expect(nextProps.clickZoomToSelection.calledOnce).to.equal(true);
        expect(nextProps.clickResetMap.calledOnce).to.equal(true);
    })
});