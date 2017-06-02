import React from 'react';
import sinon from 'sinon';
import {shallow, mount} from 'enzyme';
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

    it('getFontSize should return the font string based on window width', () => {
        const wrapper = shallow(<DataPackLinkButton/>);
        
        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getFontSize()).toEqual('11px');
        
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getFontSize()).toEqual('12px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getFontSize()).toEqual('13px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getFontSize()).toEqual('14px');
    });
});
