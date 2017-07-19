import {DrawAOIToolbar} from '../../components/CreateDataPack/DrawAOIToolbar';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DrawBoxButton} from '../../components/CreateDataPack/DrawBoxButton';
import {DrawFreeButton} from '../../components/CreateDataPack/DrawFreeButton';
import {MapViewButton} from '../../components/CreateDataPack/MapViewButton';
import {ImportButton} from '../../components/CreateDataPack/ImportButton';
import {fakeStore} from '../../__mocks__/fakeStore';
import { Provider } from 'react-redux';
import getMuiTheme from 'material-ui/styles/getMuiTheme';


describe('DrawAOIToolbar component', () => {
    const muiTheme = getMuiTheme();

    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            handleCancel: (sender) => {},
            setMapView: () => {},
            setAllButtonsDefault: sinon.spy(),
        }
        const store = fakeStore({});
        const wrapper = mount(<Provider store={store}><DrawAOIToolbar {...props}/></Provider>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.drawButtonsContainer')).toHaveLength(1);
        expect(wrapper.find('.drawButtonsTitle')).toHaveLength(1);
        expect(wrapper.find('.drawButtonsTitle').text()).toEqual('TOOLS');
        expect(wrapper.find(DrawBoxButton)).toHaveLength(1);
        expect(wrapper.find(DrawFreeButton)).toHaveLength(1);
        expect(wrapper.find(MapViewButton)).toHaveLength(1);
        expect(wrapper.find(ImportButton)).toHaveLength(1);
        expect(props.setAllButtonsDefault.calledOnce).toEqual(true);
    });
});
