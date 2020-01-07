import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import DrawAOIToolbar from '../../components/MapTools/DrawAOIToolbar';
import DrawBoxButton from '../../components/MapTools/DrawBoxButton';
import DrawFreeButton from '../../components/MapTools/DrawFreeButton';
import MapViewButton from '../../components/MapTools/MapViewButton';
import ImportButton from '../../components/MapTools/ImportButton';

describe('DrawAOIToolbar component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            handleCancel: sinon.spy(),
            setAllButtonsDefault: sinon.spy(),
            setBoxButtonSelected: sinon.spy(),
            setFreeButtonSelected: sinon.spy(),
            setImportButtonSelected: sinon.spy(),
            setImportModalState: sinon.spy(),
            setMapView: sinon.spy(),
            setMapViewButtonSelected: sinon.spy(),
            toolbarIcons: {},
            updateMode: sinon.spy(),
            ...global.eventkit_test_props,
        };

        const wrapper = shallow(<DrawAOIToolbar {...props} />);
        expect(wrapper.find('#container')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title').text()).toEqual('AOI TOOLS');
        expect(wrapper.find(DrawBoxButton)).toHaveLength(1);
        expect(wrapper.find(DrawFreeButton)).toHaveLength(1);
        expect(wrapper.find(MapViewButton)).toHaveLength(1);
        expect(wrapper.find(ImportButton)).toHaveLength(1);
    });
});
