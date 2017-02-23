import {DrawAOIToolbar} from '../components/DrawAOIToolbar';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DrawBoxButton} from '../components/DrawBoxButton';
import {DrawFreeButton} from '../components/DrawFreeButton';
import {MapViewButton} from '../components/MapViewButton';
import {ImportButton} from '../components/ImportButton';
import {fakeStore} from '../__mocks__/fakeStore';
import { Provider } from 'react-redux';

describe('DrawAOIToolbar component', () => {
    it('should render a toolbar title and 4 sub components', () => {
        const props = {
            handleCancel: (sender) => {},
            setMapView: () => {},
            setAllButtonsDefault: sinon.spy(),
        }
        const store = fakeStore({});
        const wrapper = mount(<Provider store={store}><DrawAOIToolbar {...props}/></Provider>);
        expect(wrapper.find('.drawButtonsContainer')).to.have.length(1);
        expect(wrapper.find('.drawButtonsTitle')).to.have.length(1);
        expect(wrapper.find('.drawButtonsTitle').text()).to.equal('TOOLS');
        expect(wrapper.find(DrawBoxButton)).to.have.length(1);
        expect(wrapper.find(DrawFreeButton)).to.have.length(1);
        expect(wrapper.find(MapViewButton)).to.have.length(1);
        expect(wrapper.find(ImportButton)).to.have.length(1);
        expect(props.setAllButtonsDefault.calledOnce).to.equal(true);
    });
});
