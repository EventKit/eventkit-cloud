import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DropDownMenu from 'material-ui/DropDownMenu';
import BaseDialog from '../../components/BaseDialog';
import DataPackShareDialog from '../../components/DataPackPage/DataPackShareDialog';

describe('DataPackPage component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            show: false,
            onClose: () => {},
            onSave: () => {},
            groups: [
                {
                    id: 'group1',
                    name: 'group1',
                    members: ['user1', 'user2', 'user3', 'user4'],
                    administrators: ['user1'],
                }, {
                    id: 'group2',
                    name: 'group2',
                    members: ['user1', 'user2', 'user3'],
                    administrators: ['user1'],
                }, {
                    id: 'group3',
                    name: 'group3',
                    members: ['user1', 'user2'],
                    administrators: ['user3'],
                },
            ],
            users: [
                { id: 'user1', username: 'user1', email: 'user1@email.com' },
                { id: 'user2', username: 'user2', email: 'user2@email.com' },
                { id: 'user3', username: 'user3', email: 'user3@email.com' },
                { id: 'user4', username: 'user4', email: 'user4@email.com' },
            ],
            user: {
                username: 'user1',
            },
            run: {
                job: { uid: '12345' },
                users: ['user1', 'user2', 'user3'],
            },
        }
    );

    const getWrapper = props => (
        mount(<DataPackShareDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        wrapper.setProps({ ...props, show: true });
        const dropDownContainer = mount(wrapper.find(BaseDialog).props().children[0], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(dropDownContainer.find(DropDownMenu)).toHaveLength(1);
        expect(dropDownContainer.find('.qa-DataPackShareDialog-rowHeader')).toHaveLength(1);
        expect(wrapper.state().dropDownValue).toEqual('custom');
    });

    it('handleDropDownChange should set dropDownValue', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackShareDialog.prototype, 'setState');
        const wrapper = getWrapper(props);
        const value = 'test value';
        wrapper.instance().handleDropDownChange({}, 0, value);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ dropDownValue: value })).toBe(true);
        stateStub.restore();
    });

    it('handleSave should do something when all selected and needs updating', () => {
        // TODO update this when its ready
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ dropDownValue: 'all', currentSelection: ['user1', 'user2'] });
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
    });

    it('handleSave should do something when all selected and does not need updating', () => {
        // TODO update this when its ready
        const props = getProps();
        props.onSave = sinon.spy();
        props.users = [{}, {}, {}, {}, {}];
        const wrapper = getWrapper(props);
        wrapper.setState({ dropDownValue: 'all' });
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
    });

    it('handleSave should do something when custom is selected and needs updating', () => {
        // TODO update this when its ready
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ currentSelection: ['user1', 'user2'] });
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
    });

    it('handleSave should do something when custom is selected and does not need updating', () => {
        // TODO update this when its ready
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
    });

    it('updateSelection should set the new selection in state', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackShareDialog.prototype, 'setState');
        const wrapper = getWrapper(props);
        const newSelection = ['new1', 'new2'];
        wrapper.instance().updateSelection(newSelection);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ currentSelection: newSelection }));
        stateStub.restore();
    });
});
