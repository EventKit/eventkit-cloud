import ClassificationBanner from '../components/ClassificationBanner'
import React from 'react'
import {expect} from 'chai'
import {mount, shallow} from 'enzyme'
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux'

describe('ExportInfo component', () => {
    it('should render a div that contains a string', () => {
        const store = fakeStore({});
        const wrapper = mount(<Provider store={store}><ClassificationBanner/></Provider>);
        expect(wrapper.find('.classificationbanner')).to.have.length(1)
        //TODO: we need to have a constants file that contains classification string, not hard coded
        expect(wrapper.find('.classificationbanner').text()).to.equal('UNCLASSIFIED');
    })

    })