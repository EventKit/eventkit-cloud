import {DropZone} from '../components/DropZone';
import {DropZoneDialog} from '../components/DropZoneDialog';
import {DropZoneError} from '../components/DropZoneError';
import React from 'react';
import { Provider } from 'react-redux';
import {expect} from 'chai';
import {mount} from 'enzyme';
import {fakeStore} from '../__mocks__/fakeStore';

describe('DropZone component', () => {

    const store = fakeStore({});

    it('should render a div containing the dialog and error components', () => {
        const wrapper = mount(<Provider store={store}><DropZone/></Provider>);
        expect(wrapper.find(DropZoneDialog)).to.have.length(1);
        expect(wrapper.find(DropZoneError)).to.have.length(1);
    });
});
