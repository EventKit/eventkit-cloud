import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackLinkButton from '../../components/DataPackPage/DataPackLinkButton';

describe('DataPackLinkButton component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    it('should render a linked button', () => {
        const wrapper = mount(<DataPackLinkButton />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(Link)).toHaveLength(1);
        expect(wrapper.find(Link).props().to).toEqual('/create');
        expect(wrapper.find(RaisedButton)).toHaveLength(1);
        expect(wrapper.find('span').text()).toEqual('Create DataPack');
    });
});
