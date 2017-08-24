import {DrawAOIToolbar} from '../../components/MapTools/DrawAOIToolbar';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DrawBoxButton} from '../../components/MapTools/DrawBoxButton';
import {DrawFreeButton} from '../../components/MapTools/DrawFreeButton';
import {MapViewButton} from '../../components/MapTools/MapViewButton';
import {ImportButton} from '../../components/MapTools/ImportButton';
import {fakeStore} from '../../__mocks__/fakeStore';
import { Provider } from 'react-redux';
import getMuiTheme from 'material-ui/styles/getMuiTheme';


describe('DrawAOIToolbar component', () => {
    const muiTheme = getMuiTheme();

    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            toolbarIcons: {},
            updateMode: () => {},
            handleCancel: (sender) => {},
            setMapView: () => {},
            setAllButtonsDefault: sinon.spy(),
            setBoxButtonSelected: () => {},
            setFreeButtonSelected: () => {},
            setMapViewButtonSelected: () => {},
            setImportButtonSelected: () => {},
            setImportModalState: () => {},
        }
        const store = fakeStore({});
        const wrapper = mount(<Provider store={store}><DrawAOIToolbar {...props}/></Provider>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('#container')).toHaveLength(1);
        expect(wrapper.find('#title')).toHaveLength(1);
        expect(wrapper.find('#title').text()).toEqual('TOOLS');
        expect(wrapper.find(DrawBoxButton)).toHaveLength(1);
        expect(wrapper.find(DrawFreeButton)).toHaveLength(1);
        expect(wrapper.find(MapViewButton)).toHaveLength(1);
        expect(wrapper.find(ImportButton)).toHaveLength(1);
        expect(props.setAllButtonsDefault.calledOnce).toEqual(true);
    });
});
