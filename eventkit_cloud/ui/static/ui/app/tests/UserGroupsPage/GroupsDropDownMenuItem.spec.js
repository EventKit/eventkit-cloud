import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MenuItem from 'material-ui/MenuItem';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import { GroupsDropDownMenuItem } from '../../components/UserGroupsPage/GroupsDropDownMenuItem';

describe('GroupsDropDownMenu component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            group: {
                id: 'group1',
                name: 'group1',
            },
            onClick: () => {},
            selected: false,
        }
    );

    const getWrapper = props => (
        mount(<GroupsDropDownMenuItem {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render a MenuItem', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsDropDownMenuItem-groupName').text()).toEqual(props.group.name);
        // there should be no check if not selected
        expect(wrapper.find(CheckIcon)).toHaveLength(0);
        const nextProps = getProps();
        nextProps.selected = true;
        wrapper.setProps(nextProps);
        // there should be a check if it is selected
        expect(wrapper.find(CheckIcon)).toHaveLength(1);
    });

    it('should call props.onClick with group onClick', () => {
        const props = getProps();
        props.onClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(MenuItem).props().onTouchTap();
        expect(props.onClick.calledOnce).toBe(true);
        expect(props.onClick.calledWith(props.group)).toBe(true);
    });
});
