import * as sinon from 'sinon';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { shallow } from 'enzyme';
import IconMenu from "../../components/common/IconMenu";
import {GroupPanelBody} from "../../components/UserGroupsPage/GroupPanelBody";
import {CustomScrollbar} from "../../components/common/CustomScrollbar";
import {MenuList, MenuItem} from "@mui/material";

describe('GroupPanelBody component', () => {

    const getProps = () => ({
        selectedValue: '',
        selectedTab: 'admin',
        onSelectionChange: sinon.spy(),
        getGroupsRange: sinon.spy(),
        setFetchingGroups: sinon.spy(),
        groups: {
            groups: [
                {
                    name: 'group1',
                    id: 1,
                    administrators: ['user_one'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group2',
                    id: 2,
                    administrators: ['user_two'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group3',
                    id: 3,
                    administrators: ['user_two'],
                    members: ['user_two'],
                },
            ],
            cancelSource: null,
            fetching: false,
            fetched: false,
            creating: false,
            created: false,
            deleting: false,
            deleted: false,
            updating: false,
            updated: false,
            error: null,
        },
        ownedGroups: [{
            id: 1,
            name: 'group1',
            members: ['user1', 'user2'],
            administrators: ['user1'],
        }],
        sharedGroups: [{
            id: 2,
            name: 'group2',
            members: ['user2', 'user1'],
            administrators: ['user2'],
        }],
        otherGroups: [{
            id: 3,
            name: 'group3',
            members: ['user3', 'user2'],
            administrators: ['user3'],
        }],
        onLeaveGroupClick: sinon.spy(),
        onDeleteGroupClick: sinon.spy(),
        onRenameGroupClick: sinon.spy(),
        onAdministratorInfoClick: sinon.spy(),
        onMemberInfoClick: sinon.spy(),
        onOtherInfoClick: sinon.spy(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<GroupPanelBody {...props}/>);

    it('should render something', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(InfoIcon)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(4);
        console.log(wrapper.debug())
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
    });

    it('should render group items of selected group tab', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(MenuList)).toHaveLength(1);
    });

    it('Change Group Name should call onRenameGroupClick', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(props.onRenameGroupClick.calledOnce).toBe(false);
        wrapper.find(IconMenu).props().children[0].props.onClick();
        expect(props.onRenameGroupClick.calledOnce).toBe(true);
    });

    it('Delete Group Name should call onDeleteGroupClick', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(props.onDeleteGroupClick.calledOnce).toBe(false);
        wrapper.find(IconMenu).props().children[2].props.onClick();
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(props.onLeaveGroupClick.called).toBe(false);
        wrapper.find(IconMenu).props().children[1].props.onClick();
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
        expect(props.onLeaveGroupClick.calledWith(props.ownedGroups[0])).toBe(true);
    });
});
