import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import ActionViewModule from '@material-ui/icons/ViewModule';
import ActionViewStream from '@material-ui/icons/ViewStream';
import MapsMap from '@material-ui/icons/Map';
import IconButton from '@material-ui/core/IconButton';
import { DataPackViewButtons } from '../../components/DataPackPage/DataPackViewButtons';

describe('DataPackViewButtons component', () => {
    const getProps = () => ({
        handleViewChange: sinon.spy(),
        view: 'map',
        ...(global as any).eventkit_test_props,
    });

    it('should render three icon buttons', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackViewButtons {...props} />);
        expect(wrapper.find(IconButton)).toHaveLength(3);
        expect(wrapper.find(ActionViewModule)).toHaveLength(1);
        expect(wrapper.find(ActionViewStream)).toHaveLength(1);
        expect(wrapper.find(MapsMap)).toHaveLength(1);
    });

    it('should call handleViewChange with the text of which view was selected', () => {
        const props = getProps();
        props.handleViewChange = sinon.spy();
        const wrapper = shallow(<DataPackViewButtons {...props} />);
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
        const wrapper = shallow(<DataPackViewButtons {...props} />);

        const styles = {
            icon: { height: '22px', width: '22px' },
            selectedIcon: {
                color: '#253447', height: '22px', width: '22px', backgroundColor: '#4598bf',
            },
        };

        expect(wrapper.find(MapsMap).props().style).toEqual(styles.selectedIcon);
        expect(wrapper.find(ActionViewModule).props().style).toEqual(styles.icon);
        expect(wrapper.find(ActionViewStream).props().style).toEqual(styles.icon);
        let nextProps = getProps();
        nextProps.view = 'grid';
        wrapper.setProps(nextProps);
        expect(wrapper.find(MapsMap).props().style).toEqual(styles.icon);
        expect(wrapper.find(ActionViewModule).props().style).toEqual(styles.selectedIcon);
        expect(wrapper.find(ActionViewStream).props().style).toEqual(styles.icon);
        nextProps = getProps();
        nextProps.view = 'list';
        wrapper.setProps(nextProps);
        expect(wrapper.find(MapsMap).props().style).toEqual(styles.icon);
        expect(wrapper.find(ActionViewModule).props().style).toEqual(styles.icon);
        expect(wrapper.find(ActionViewStream).props().style).toEqual(styles.selectedIcon);
    });
});
