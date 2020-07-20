import * as React from 'react';
import * as sinon from 'sinon';
import { GroupsDrawer } from '../../components/UserGroupsPage/GroupsDrawer';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'

describe('GroupsDrawer component', () => {
    const getProps = () => ({
        selectedValue: '',
        onSelectionChange: sinon.spy(),
        open: true,
        ownedGroups: [{
            id: 1,
            name: 'group1',
            members: ['user1', 'user2'],
            administrators: ['user1'],
        }],
        sharedGroups: [{
            id: 2,
            name: 'group2',
            members: ['user1', 'user2'],
            administrators: ['user2'],
        }],
        otherGroups: [{
            id: 3,
            name: 'group3',
            members: ['user2', 'user3'],
            administrators: ['user3'],
        }],
        usersCount: 2,
        onNewGroupClick: sinon.spy(),
        onSharedInfoClick: sinon.spy(),
        onLeaveGroupClick: sinon.spy(),
        onDeleteGroupClick: sinon.spy(),
        onRenameGroupClick: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    const setup = (propsOverride = {}) => {
        props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<GroupsDrawer {...props} />);
    };

    beforeEach(setup);

    it('should render something', () => {
        expect(screen.getByText('MEMBERS')).toBeInTheDocument();
    });

    it('should render menu items for the group menu', () => {
        const {container} = setup();
        // Find the menu expander
        const menuIcon = container.querySelector('.qa-GroupsDrawer-groupOptions');
        expect(menuIcon).toBeInTheDocument();
        // Simulate the user clicking it
        fireEvent.click(menuIcon)
        expect(screen.getByText('Change Group Name')).toBeInTheDocument();
        expect(screen.getByText('Leave Group')).toBeInTheDocument();
        expect(screen.getByText('Delete Group')).toBeInTheDocument();
    });

    it('Change Group Name should call onRenameGroupClick', () => {
        const {container} = setup();
        // Find the menu expander
        const menuIcon = container.querySelector('.qa-GroupsDrawer-groupOptions');
        expect(menuIcon).toBeInTheDocument();
        // Simulate the user clicking it
        fireEvent.click(menuIcon)
        expect(props.onRenameGroupClick.calledOnce).toBe(false);
        fireEvent.click(screen.getByText('Change Group Name'))
        expect(props.onRenameGroupClick.calledOnce).toBe(true);
    });

    it('Delete Group Name should call onDeleteGroupClick', () => {
        const {container} = setup();
        // Find the menu expander
        const menuIcon = container.querySelector('.qa-GroupsDrawer-groupOptions');
        expect(menuIcon).toBeInTheDocument();
        // Simulate the user clicking it
        fireEvent.click(menuIcon)
        expect(props.onDeleteGroupClick.calledOnce).toBe(false);
        fireEvent.click(screen.getByText('Delete Group'))
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const {container} = setup();
        // Find the menu expander
        const menuIcon = container.querySelector('.qa-GroupsDrawer-groupOptions');
        expect(menuIcon).toBeInTheDocument();
        // Simulate the user clicking it
        fireEvent.click(menuIcon)
        expect(props.onLeaveGroupClick.calledOnce).toBe(false);
        fireEvent.click(screen.getByText('Leave Group'))
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
    });
});
