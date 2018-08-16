import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import ActionViewModule from '@material-ui/icons/ViewModule';
import ActionViewStream from '@material-ui/icons/ViewStream';
import MapsMap from '@material-ui/icons/Map';
import IconButton from 'material-ui/IconButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackViewButtons from '../../components/DataPackPage/DataPackViewButtons';

describe('DataPackViewButtons component', () => {
    const getProps = () => ({
        handleViewChange: () => {},
        view: 'map',
    });
    const muiTheme = getMuiTheme();

    it('should render three icon buttons', () => {
        const props = getProps();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(IconButton)).toHaveLength(3);
        expect(wrapper.find(ActionViewModule)).toHaveLength(1);
        expect(wrapper.find(ActionViewStream)).toHaveLength(1);
        expect(wrapper.find(MapsMap)).toHaveLength(1);
    });

    it('should call handleViewChange with the text of which view was selected', () => {
        const props = getProps();
        props.handleViewChange = sinon.spy();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(props.handleViewChange.notCalled).toBe(true);
        wrapper.find(IconButton).at(1).simulate('click');
        expect(props.handleViewChange.calledWith('grid')).toBe(true);
        wrapper.find(IconButton).at(2).simulate('click');
        expect(props.handleViewChange.calledWith('list')).toBe(true);
        wrapper.find(IconButton).at(0).simulate('click');
        expect(props.handleViewChange.calledWith('map')).toBe(true);
    });

    it('the icon should indicate if the view is active', () => {
        const props = getProps();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });

        const styles = {
            icon: { color: '#4498c0', height: '22px', width: '22px' },
            selectedIcon: {
                color: '#253447', height: '22px', width: '22px', backgroundColor: '#4498c0',
            },
        };

        expect(wrapper.find(IconButton).at(0).props().iconStyle).toEqual(styles.selectedIcon);
        expect(wrapper.find(IconButton).at(1).props().iconStyle).toEqual(styles.icon);
        expect(wrapper.find(IconButton).at(2).props().iconStyle).toEqual(styles.icon);
        let nextProps = getProps();
        nextProps.view = 'grid';
        wrapper.setProps(nextProps);
        expect(wrapper.find(IconButton).at(0).props().iconStyle).toEqual(styles.icon);
        expect(wrapper.find(IconButton).at(1).props().iconStyle).toEqual(styles.selectedIcon);
        expect(wrapper.find(IconButton).at(2).props().iconStyle).toEqual(styles.icon);
        nextProps = getProps();
        nextProps.view = 'list';
        wrapper.setProps(nextProps);
        expect(wrapper.find(IconButton).at(0).props().iconStyle).toEqual(styles.icon);
        expect(wrapper.find(IconButton).at(1).props().iconStyle).toEqual(styles.icon);
        expect(wrapper.find(IconButton).at(2).props().iconStyle).toEqual(styles.selectedIcon);
    });
});
