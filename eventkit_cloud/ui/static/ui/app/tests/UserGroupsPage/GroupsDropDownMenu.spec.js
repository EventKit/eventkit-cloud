import React, { PropTypes } from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import CircularProgress from 'material-ui/CircularProgress';
import { GroupsDropDownMenu } from '../../components/UserGroupsPage/GroupsDropDownMenu';
import { CustomScrollbar } from '../../components/CustomScrollbar';

describe('GroupsDropDownMenu component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            open: true,
            onClose: () => {},
            loading: false,
        }
    );

    const getWrapper = props => (
        // using shallow because the MUI components inside are super weird to test
        shallow((
            <GroupsDropDownMenu {...props}>
                <div className="childElement" >hello im a child element</div>
            </GroupsDropDownMenu>), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render a popover', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Popover)).toHaveLength(1);
    });

    it('should render a popover', () => {
        const props = getProps();
        props.open = false;
        const wrapper = getWrapper(props);
        wrapper.setProps({ open: true });
        expect(wrapper.find(Menu)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
    });

    it('should render any children passed to it', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.childElement'));
        expect(wrapper.find('.childElement').text()).toEqual('hello im a child element');
    });

    it('should display a loading icon', () => {
        const props = getProps();
        props.open = true;
        props.loading = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('scrollToTop should call scrollToTop on the custom scrollbar', () => {
        const props = getProps();
        props.open = true;
        const wrapper = getWrapper(props);
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollToTop: scrollSpy };
        wrapper.instance().scrollbar = scrollbar;
        wrapper.instance().scrollToTop();
        expect(scrollSpy.calledOnce).toBe(true);
    });
});
