import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { DrawAOIToolbar } from '../../components/MapTools/DrawAOIToolbar';
import { DrawBoxButton } from '../../components/MapTools/DrawBoxButton';
import { DrawFreeButton } from '../../components/MapTools/DrawFreeButton';
import { MapViewButton } from '../../components/MapTools/MapViewButton';
import { ImportButton } from '../../components/MapTools/ImportButton';
import { BufferButton } from '../../components/MapTools/BufferButton';


describe('DrawAOIToolbar component', () => {
    const muiTheme = getMuiTheme();

    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            toolbarIcons: {},
            updateMode: () => {},
            handleCancel: () => {},
            setMapView: () => {},
            setAllButtonsDefault: sinon.spy(),
            setBoxButtonSelected: () => {},
            setFreeButtonSelected: () => {},
            setMapViewButtonSelected: () => {},
            setImportButtonSelected: () => {},
            setImportModalState: () => {},
            showBufferButton: false,
        };

        const wrapper = mount(<DrawAOIToolbar {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find('#container')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title')).toHaveLength(1);
        expect(wrapper.find('.qa-DrawAOIToolbar-div-title').text()).toEqual('TOOLS');
        expect(wrapper.find(DrawBoxButton)).toHaveLength(1);
        expect(wrapper.find(DrawFreeButton)).toHaveLength(1);
        expect(wrapper.find(MapViewButton)).toHaveLength(1);
        expect(wrapper.find(ImportButton)).toHaveLength(1);
        expect(wrapper.find(BufferButton)).toHaveLength(0);
        expect(props.setAllButtonsDefault.calledOnce).toEqual(true);
        const newProps = { ...props };
        newProps.showBufferButton = true;
        wrapper.setProps(newProps);
        expect(wrapper.find(BufferButton)).toHaveLength(1);
    });
});
