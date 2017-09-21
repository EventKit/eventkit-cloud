import {PopupBox} from '../components/PopupBox';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ContentClear from 'material-ui/svg-icons/content/clear';

describe('PopupBox component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            show: false,
            title: 'test title',
            onExit: () => {},
        }
    };

    it('should display an empty div when props.show == false', () => {
        const props = getProps();
        const wrapper = mount(<PopupBox {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('div')).toHaveLength(1);
    });

    it('should display container, titlebar, body, and footer', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.qa-PopupBox-container')).toHaveLength(1);
        expect(wrapper.find('.qa-PopupBox-titlebar')).toHaveLength(1);
        expect(wrapper.find('.qa-PopupBox-title')).toHaveLength(1);
        expect(wrapper.find('.qa-PopupBox-title').text()).toEqual('test title');
        expect(wrapper.find('.qa-PopupBox-exit')).toHaveLength(1);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find('.qa-PopupBox-body')).toHaveLength(1);
        expect(wrapper.find('.qa-PopupBox-footer')).toHaveLength(1);
    });

    it('should execute the passed in function when exit button is clicked', () =>{
        let props = getProps();
        props.onExit = sinon.spy();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.onExit.calledOnce).toEqual(true);
    });

    it('should render any child elements', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}><p>my child</p></PopupBox>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p')).toHaveLength(1);
        expect(wrapper.find('p').text()).toEqual('my child');
    });
});
