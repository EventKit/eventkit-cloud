import * as React from 'react';
import * as sinon from 'sinon';
import {Tab, Tabs} from "@material-ui/core";
import {createShallow} from "@material-ui/core/test-utils";
import {GroupsHeaderTabs} from "../../components/UserGroupsPage/GroupsHeaderTabs";

describe('GroupPanelBody component', () => {
    let shallow: any;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        selectedTab: 'admin',
        handleChange: sinon.spy(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<GroupsHeaderTabs {...props}/>);

    it('should render something', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Tabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(3);
    });

    it('clicking on "Member" tab should fire handleChange to show Shared Groups', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const mockedEvent = sinon.spy();
        const mockCallBack = sinon.spy();
        const value = 'member';
        expect(wrapper
            .find(Tab)
            .at(0)
            .props().value)
            .toBe('admin');
        mockCallBack(mockedEvent, value);
        wrapper.find(Tab).at(0).simulate('change');
        expect(mockCallBack.calledOnce).toBe(true);
    });
});
