import * as sinon from 'sinon';

import { screen, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

import { DataPackShareDialog, Props } from '../../components/DataPackShareDialog/DataPackShareDialog';
import { Permissions } from '../../utils/permissions';

describe('DataPackPage component', () => {
    const getPermissions = (): Props['permissions'] => ({
        value: 'PRIVATE',
        members: {},
        groups: {},
    });

    const getProps = () => ({
        show: true,
        onClose: sinon.spy(),
        onSave: sinon.spy(),
        groups: [
            {
                id: 1,
                name: 'group_one',
                members: ['user_one', 'user_two', 'user_three'],
                administrators: ['user_one'],
            }, {
                id: 2,
                name: 'group_two',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            }, {
                id: 3,
                name: 'group_three',
                members: ['user_one', 'user_two'],
                administrators: ['user_three'],
            },
        ],
        users: [
            {
                user: {
                    username: 'user_one',
                    firt_name: 'user',
                    last_name: 'one',
                    email: 'user_one@email.com',
                },
                groups: [1, 2, 3],
            },
            {
                user: {
                    username: 'user_two',
                    first_name: 'user',
                    last_name: 'two',
                    email: 'user_two@email.com',
                },
                groups: [1, 2, 3],
            },
            {
                user: {
                    username: 'user_three',
                    first_name: 'user',
                    last_name: 'three',
                    email: 'user_three@email.com',
                },
                groups: [1],
            },
        ],
        permissions: getPermissions(),
        user: {
            user: { username: 'admin' },
            groups: [],
        },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let component;

    const setup = (params = {}, options = {}) => {
        props = { ...getProps(), ...params };
        component = TestUtils.renderComponent(<DataPackShareDialog {...props} />, {
           includeToastContainer: false
        });
    };

    beforeEach(setup);

    it('should render null if not open', () => {
        setup({ show: false });
        expect(component.container.children).toHaveLength(0);
    });

    it('should render all the basic components', () => {
        expect(screen.getByText('SHARE'));
    });

    it('should display the selected count on the header buttons', () => {
        expect(screen.getByText('GROUPS (0)'));
        expect(screen.getByText('MEMBERS (0)'));
    });

    it('should display numbers as the selected count on the header buttons', () => {
        const p = getProps();
        p.user.groups = [1, 2, 3];
        p.permissions.groups = { group_one: '', group_two: '', group_three: '' };
        p.permissions.members = { user_one: '', user_two: '', user_three: '' };
        setup(p);
        expect(screen.getByText('GROUPS (3)'));
        expect(screen.getByText('MEMBERS (3)'));
    });

    it('handleSave do nothing but call props.onSave with permissions', () => {
        const permissions = new Permissions(getPermissions());
        const saveButton = screen.getByText('SAVE');
        fireEvent.click(saveButton);
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(permissions.getPermissions())).toBe(true);
    });
});
