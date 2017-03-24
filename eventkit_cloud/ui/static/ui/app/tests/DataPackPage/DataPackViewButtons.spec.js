import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';
import ActionViewModule from 'material-ui/svg-icons/action/view-module';
import ActionViewStream from 'material-ui/svg-icons/action/view-stream';
import IconButton from 'material-ui/IconButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackViewButtons from '../../components/DataPackPage/DataPackViewButtons';

describe('DataPackViewButtons component', () => {
    const getProps = () => {
        return {
            handleGridSelect: () => {},
            handleListSelect: () => {}
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();
    
    it('should render two icon buttons', () => {
        const props = getProps();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(IconButton)).to.have.length(2);
        expect(wrapper.find(IconButton).first().props().tooltip).to.equal('Grid View');
        expect(wrapper.find(IconButton).last().props().tooltip).to.equal('List View');
        expect(wrapper.find(ActionViewModule)).to.have.length(1);
        expect(wrapper.find(ActionViewStream)).to.have.length(1);
    });

    it('should call handleGridSelect', () => {
        let props = getProps();
        props.handleGridSelect = new sinon.spy();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(IconButton).first().simulate('click');
        expect(props.handleGridSelect.calledOnce).to.be.true;
    });

    it('should call handleListSelect', () => {
        let props = getProps();
        props.handleListSelect = new sinon.spy();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(IconButton).last().simulate('click');
        expect(props.handleListSelect.calledOnce).to.be.true;
    });
});
