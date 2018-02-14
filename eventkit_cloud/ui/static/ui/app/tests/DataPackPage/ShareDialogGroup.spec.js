import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ShareDialogGroup from '../../components/DataPackPage/ShareDialogGroup';

describe('ShareDialogGroup component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            group: {
                id: 'group1',
                name: 'group1',
                members: ['user1', 'user2', 'user3', 'user4'],
                administrators: ['user1'],
            },
            users: [
                { name: 'user1', username: 'user1', email: 'user1@gmail.com' },
                { name: 'user2', username: 'user2', email: 'user2@gmail.com' },
                { name: 'user3', username: 'user3', email: 'user3@gmail.com' },
                { name: 'user4', username: 'user4', email: 'user4@gmail.com' },
            ],
            selection: [],
            updateSelection: () => {},
        }
    );

    const getWrapper = props => (
        mount(<ShareDialogGroup {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        // it should not be expanded by default
        expect(wrapper.find(CardText)).toHaveLength(0);
    });

    it('CheckBox should call handleCheckedClick, CheckboxOutline should call handleUncheckedClick', () => {
        const props = getProps();
        props.selection = ['user1', 'user2'];
        const notSelected = ['user3', 'user4'];
        const checkedStub = sinon.stub(ShareDialogGroup.prototype, 'handleCheckedClick');
        const uncheckedStub = sinon.stub(ShareDialogGroup.prototype, 'handleUncheckedClick');
        const wrapper = getWrapper(props);
        wrapper.setState({ expanded: true });
        expect(wrapper.find(CardText)).toHaveLength(1);
        expect(wrapper.find(CheckBox)).toHaveLength(props.selection.length);
        expect(wrapper.find(CheckBoxOutline)).toHaveLength(notSelected.length);
        wrapper.find(CheckBox).first().simulate('click');
        expect(checkedStub.calledOnce).toBe(true);
        expect(checkedStub.calledWith(props.selection[0])).toBe(true);
        wrapper.find(CheckBoxOutline).first().simulate('click');
        expect(uncheckedStub.calledOnce).toBe(true);
        expect(uncheckedStub.calledWith(notSelected[0])).toBe(true);
        checkedStub.restore();
        uncheckedStub.restore();
    });

    it('toggleExpanded should switch teh expanded state', () => {
        const props = getProps();
        const stateStub = sinon.stub(ShareDialogGroup.prototype, 'setState');
        const wrapper = getWrapper(props);
        const expected = !wrapper.state().expanded;
        wrapper.instance().toggleExpanded();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ expanded: expected })).toBe(true);
        stateStub.restore();
    });

    it('handleUncheckAll should updateSelection with empty array', () => {
        const props = getProps();
        props.updateSelection = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleUncheckAll();
        expect(props.updateSelection.calledOnce).toBe(true);
        expect(props.updateSelection.calledWith([])).toBe(true);
    });

    it('handleCheckAll should updateSelection with group members', () => {
        const props = getProps();
        props.updateSelection = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleCheckAll();
        expect(props.updateSelection.calledOnce).toBe(true);
        expect(props.updateSelection.calledWith(props.group.members)).toBe(true);
    });

    it('handleCheckedClick should remove the user from selection', () => {
        const props = getProps();
        props.updateSelection = sinon.spy();
        props.selection = [...props.group.members];
        const wrapper = getWrapper(props);
        wrapper.instance().handleCheckedClick(props.selection[0]);
        expect(props.updateSelection.calledOnce).toBe(true);
        const expected = [...props.selection];
        expected.splice(0, 1);
        expect(props.updateSelection.calledWith(expected)).toBe(true);
    });

    it('handleUncheckedClick should add user to the selection', () => {
        const props = getProps();
        props.updateSelection = sinon.spy();
        props.selection = [props.group.members[0]];
        const wrapper = getWrapper(props);
        wrapper.instance().handleUncheckedClick(props.group.members[1]);
        expect(props.updateSelection.calledOnce).toBe(true);
        const expected = [props.group.members[0], props.group.members[1]];
        expect(props.updateSelection.calledWith(expected)).toBe(true);
    });
});
