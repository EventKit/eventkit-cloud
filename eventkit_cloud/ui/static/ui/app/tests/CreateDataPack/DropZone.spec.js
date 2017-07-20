import {DropZone} from '../../components/CreateDataPack/DropZone';
import {DropZoneDialog} from '../../components/CreateDataPack/DropZoneDialog';
import {DropZoneError} from '../../components/CreateDataPack/DropZoneError';
import React from 'react';
import { Provider } from 'react-redux';
import {mount} from 'enzyme';
import {fakeStore} from '../../__mocks__/fakeStore';

describe('DropZone component', () => {

    const store = fakeStore({});

    it('should render a div containing the dialog and error components', () => {
        const wrapper = mount(<Provider store={store}><DropZone/></Provider>);
        expect(wrapper.find(DropZoneDialog)).toHaveLength(1);
        expect(wrapper.find(DropZoneError)).toHaveLength(1);
    });
});
