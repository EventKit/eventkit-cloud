import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';

describe('AlertCallout component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            style: {},
            onClose: () => {},
            title: 'test title',
            body: 'test body',
        }
    );

    const getWrapper = props => (
        mount(<AlertCallout {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-AlertCallout')).toHaveLength(1);
        expect(wrapper.find('.qa-AlertCallout-title').text()).toEqual('test title');
        expect(wrapper.find('.qa-AlertCallout-body').text()).toEqual('test body');
    });

    it('should call onClose when the clear icon is clicked', () => {
        const props = getProps();
        props.onClose = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Clear).simulate('click');
        expect(props.onClose.calledOnce).toBe(true);
    });
});
