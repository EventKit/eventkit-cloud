import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import ShareBaseDialog from '../../components/DataPackShareDialog/ShareBaseDialog';
import GroupsBody from '../../components/DataPackShareDialog/GroupsBody';
import MembersBody from '../../components/DataPackShareDialog/MembersBody';
import ShareInfoBody from '../../components/DataPackShareDialog/ShareInfoBody';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

describe('DataPackPage component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            show: false,
            onClose: () => {},
            onSave: () => {},
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
            members: [
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
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
            user: {
                user: { username: 'admin' },
                groups: [],
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
        expect(wrapper.find(ShareBaseDialog)).toHaveLength(1);
        wrapper.setProps({ ...props, show: true });
        const header = mount(wrapper.find(ShareBaseDialog).props().children[0], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(header.find(RaisedButton)).toHaveLength(2);
        const body = mount(wrapper.find(ShareBaseDialog).props().children[1], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(body.find(GroupsBody)).toHaveLength(1);
    });

    it('should display the ShareInfoBody', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ showShareInfo: true });
        const body = mount(wrapper.find(ShareBaseDialog).props().children[1], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(body.find(ShareInfoBody)).toHaveLength(1);
    });

    it('should display the MembersBody', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ view: 'members' });
        const body = mount(wrapper.find(ShareBaseDialog).props().children[1], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(body.find(MembersBody)).toHaveLength(1);
    });

    it('should display the selected count on the header buttons', () => {
        const props = getProps();
        props.permissions.groups = {};
        props.permissions.members = {};
        const wrapper = getWrapper(props);
        const header = mount(wrapper.find(ShareBaseDialog).props().children[0], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(header.find('.qa-DataPackShareDialog-RaisedButton-groups').text()).toEqual('GROUPS (0)');
        expect(header.find('.qa-DataPackShareDialog-RaisedButton-members').text()).toEqual('MEMBERS (0)');
    });

    it('should display "ALL" as the selected count on the header buttons', () => {
        const props = getProps();
        props.user.groups = [1, 2, 3];
        props.permissions.groups = { group_one: '', group_two: '', group_three: '' };
        props.permissions.members = { user_one: '', user_two: '', user_three: '' };
        const wrapper = getWrapper(props);
        const header = mount(wrapper.find(ShareBaseDialog).props().children[0], {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(header.find('.qa-DataPackShareDialog-RaisedButton-groups').text()).toEqual('GROUPS (ALL)');
        expect(header.find('.qa-DataPackShareDialog-RaisedButton-members').text()).toEqual('MEMBERS (ALL)');
    });

    it('getAdjustedPermissions should move the user out of the members list', () => {
        const props = getProps();
        const user = {
            user: {
                username: 'user_one',
            },
        };
        props.user = user;
        const permissions = {
            value: 'SHARED',
            groups: {},
            members: {
                user_one: 'ADMIN',
                user_two: 'READ',
            },
        };
        const wrapper = getWrapper(props);
        const expected = {
            value: 'SHARED',
            groups: {},
            members: { user_two: 'READ' },
            user: 'ADMIN',
        };
        const ret = wrapper.instance().getAdjustedPermissions(permissions);
        expect(ret).toEqual(expected);
    });

    it('getAdjustedPermissions should add all members to a public permission set', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const permissions = {
            value: 'PUBLIC',
            groups: {},
            members: { user_one: 'ADMIN' },
        };
        const expected = {
            value: 'PUBLIC',
            groups: {},
            members: {
                user_one: 'ADMIN',
                user_two: 'READ',
                user_three: 'READ',
            },
        };
        const ret = wrapper.instance().getAdjustedPermissions(permissions);
        expect(ret).toEqual(expected);
    });

    it('handleSave should call props.onSave', () => {
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(props.permissions)).toBe(true);
    });

    it('handleSave should set value to public and add admin user back in', () => {
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        const permissions = {
            value: 'SHARED',
            groups: {},
            members: {
                user_one: 'READ',
                user_two: 'READ',
                user_three: 'READ',
            },
            user: 'ADMIN',
        };
        wrapper.setState({ permissions });
        const expected = {
            value: 'PUBLIC',
            groups: permissions.groups,
            members: { ...permissions.members, admin: 'ADMIN' },
        };
        wrapper.instance().handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(expected)).toBe(true);
    });

    it('handleGroupUpdate should setState', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const groups = {
            group_one: 'READ',
            group_two: 'ADMIN',
        };
        wrapper.instance().handleGroupUpdate(groups);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: { ...props.permissions, groups } })).toBe(true);
        stateStub.restore();
    });

    it('handleMemberUpdate should setState', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const members = {
            user_one: 'ADMIN',
            user_two: 'ADMIN',
        };
        wrapper.instance().handleMemberUpdate(members);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: { ...props.permissions, members } })).toBe(true);
        stateStub.restore();
    });

    it('handleMemberUpdate should call showPublicWarning', () => {
        const props = getProps();
        props.warnPublic = true;
        const wrapper = getWrapper(props);
        const showStub = sinon.stub(wrapper.instance(), 'showPublicWarning');
        const members = {
            user_one: 'READ',
            user_two: 'READ',
            user_three: 'READ',
        };
        wrapper.instance().handleMemberUpdate(members);
        expect(showStub.calledOnce).toBe(true);
        showStub.restore();
    });

    it('showShareInfo should set show to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().showShareInfo();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showShareInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideShareInfo should set show to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().hideShareInfo();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showShareInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showPublicWarning should set show to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().showPublicWarning();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: true })).toBe(true);
        stateStub.restore();
    });

    it('hidePublicWarning should set show to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().hidePublicWarning();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: false })).toBe(true);
        stateStub.restore();
    });

    it('toggleView should set passed in view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleView('members');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'members' }));
        stateStub.restore();
    });

    it('toggleView should set opposite view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().view).toEqual('groups');
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleView();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'members' })).toBe(true);
        stateStub.restore();
    });

    it('toggleView should set opposite view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ view: 'members' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleView();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'groups' })).toBe(true);
        stateStub.restore();
    });
});
