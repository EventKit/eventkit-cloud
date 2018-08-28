import React from 'react';
import { mount } from 'enzyme';
import { DrawAOIToolbar } from '../../components/MapTools/DrawAOIToolbar';
import { DrawBoxButton } from '../../components/MapTools/DrawBoxButton';
import { DrawFreeButton } from '../../components/MapTools/DrawFreeButton';
import { MapViewButton } from '../../components/MapTools/MapViewButton';
import { ImportButton } from '../../components/MapTools/ImportButton';

describe('DrawAOIToolbar component', () => {
    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            toolbarIcons: {},
            updateMode: () => {},
            handleCancel: () => {},
            setMapView: () => {},
            setAllButtonsDefault: () => {},
            setBoxButtonSelected: () => {},
            setFreeButtonSelected: () => {},
            setMapViewButtonSelected: () => {},
            setImportButtonSelected: () => {},
            setImportModalState: () => {},
        };

        const wrapper = mount(<DrawAOIToolbar {...props} />);
        expect(wrapper.find('#container')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title').text()).toEqual('TOOLS');
        expect(wrapper.find(DrawBoxButton)).toHaveLength(1);
        expect(wrapper.find(DrawFreeButton)).toHaveLength(1);
        expect(wrapper.find(MapViewButton)).toHaveLength(1);
        expect(wrapper.find(ImportButton)).toHaveLength(1);
    });
});
