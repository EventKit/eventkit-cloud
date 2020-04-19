import * as React from 'react';
import * as sinon from 'sinon';
import { mount } from 'enzyme';
import Drawer from '@material-ui/core/Drawer';
import {MapDrawer, VerticalTabs} from "../../components/CreateDataPack/MapDrawer";
import CustomScrollbar from "../../components/common/CustomScrollbar";
import Tab from "@material-ui/core/Tab";
import ListItem from '@material-ui/core/ListItem';
import Radio from "@material-ui/core/Radio";
import {act} from "react-dom/test-utils";

jest.mock("../../components/CreateDataPack/RequestDataSource", () => {
    const React = require('react');
    return (props) => (<div id="dataSource-dialog">{props.open.toString()}</div>);
});


describe('RequestDataSource component', () => {

    const getProps = () => ({
        updateBaseMap: (mapUrl: string) => {
        },
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = mount(<MapDrawer {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(VerticalTabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(1);
        expect(wrapper.find(Drawer)).toHaveLength(wrapper.find(Tab).length);
        // Of the 3 providers, only one should be displayed
        // BaseMaps are only added when a preview_url exists AND the provider should be displayed.
        expect(wrapper.find(ListItem)).toHaveLength(1);
        expect(wrapper.find('#dataSource-dialog')).toHaveLength(1);
    });

    it('tab should have appropriate values', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        wrapper.find(Tab).forEach(node => {
            expect(node.props().value).toBe("basemap");
        });
    });

    it('should start with the basemap drawer closed', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        expect(wrapper.find(Drawer).get(0).props.open).toBe(false);
    });

    it('should start with the data source dialog closed', () => {
        act(() => wrapper.update());
        expect(wrapper.find('#dataSource-dialog').html()).toContain('false');
    });

    it('should fire the handleExpandClick function when source checkbox is clicked', () => {
        const mockedEvent = sinon.spy();
        const mockCallBack = sinon.spy();

        mockCallBack(mockedEvent, sources);

        wrapper.find(Radio).at(0).simulate('click');
        expect(mockCallBack.calledOnce).toBe(true);
    });
});