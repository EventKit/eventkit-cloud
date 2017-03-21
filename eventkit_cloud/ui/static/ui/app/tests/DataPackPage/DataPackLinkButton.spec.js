import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount} from 'enzyme';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackLinkButton from '../../components/DataPackPage/DataPackLinkButton';

describe('DataPackLinkButton component', () => {
    injectTapEventPlugin();
    const props = {fontSize: '15px'};
    const muiTheme = getMuiTheme();

    it('should render a linked button', () => {
        const wrapper = mount(<DataPackLinkButton {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(Link)).to.have.length(1);
        expect(wrapper.find(Link).props().to).to.equal('/create');
        expect(wrapper.find(RaisedButton)).to.have.length(1);
        expect(wrapper.find('span').text()).to.equal('Create DataPack');
    });
});
