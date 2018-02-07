import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DropDownMenu from 'material-ui/DropDownMenu';
import DatePicker from 'material-ui/DatePicker';
import Edit from 'material-ui/svg-icons/image/edit';
import DataPackTableRow from '../../components/StatusDownloadPage/DataPackTableRow';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';

describe('DataPackStatusTable component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            status: 'COMPLETED',
            expiration: '2017-03-24T15:52:35.637258Z',
            permission: false,
            handleExpirationChange: () => {},
            handlePermissionsChange: () => {},
        }
    );

    const getWrapper = props => (
        mount(<DataPackStatusTable {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(DataPackTableRow)).toHaveLength(3);
        expect(wrapper.find(DatePicker)).toHaveLength(1);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('Edit icon should call dp.focus on click', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const focusSpy = sinon.spy();
        wrapper.instance().dp = { focus: focusSpy };
        wrapper.find(Edit).simulate('click');
        expect(focusSpy.calledOnce).toBe(true);
    });

    it('the value of the drop down menu should be 1', () => {
        const props = getProps();
        props.permission = true;
        const wrapper = getWrapper(props);
        const val = wrapper.find(DropDownMenu).props().value;
        expect(val).toEqual(1);
    });
});
