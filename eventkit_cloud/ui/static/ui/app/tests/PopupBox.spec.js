import {PopupBox} from '../components/PopupBox';
import React from 'react';
import {expect} from 'chai';
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
        expect(wrapper.find('div')).to.have.length(1);
    });

    it('should display container, titlebar, body, and footer', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.container')).to.have.length(1);
        expect(wrapper.find('.titlebar')).to.have.length(1);
        expect(wrapper.find('.title')).to.have.length(1);
        expect(wrapper.find('span').text()).to.equal('test title');
        expect(wrapper.find('.exit')).to.have.length(1);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find(ContentClear)).to.have.length(1);
        expect(wrapper.find('.body')).to.have.length(1);
        expect(wrapper.find('.footer')).to.have.length(1);
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
        expect(props.onExit.calledOnce).to.equal(true);
    });

    it('should render any child elements', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}><p>my child</p></PopupBox>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p')).to.have.length(1);
        expect(wrapper.find('p').text()).to.equal('my child');
    });
});
