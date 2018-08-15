import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import GridList from '@material-ui/core/GridList';
import GridTile from '@material-ui/core/GridListTile';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import InfoGrid from '../../components/About/InfoGrid';

describe('InfoGrid component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            title: 'Test Header',
            items: [
                { title: 'item 1', body: 'body 1' },
                { title: 'item 2', body: 'body 2' },
            ],
        }
    );

    const getWrapper = props => (
        mount(<InfoGrid {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render a header and GridList with passed in items', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('h3')).toHaveLength(1);
        expect(wrapper.find('h3').text()).toEqual('Test Header');
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(GridTile)).toHaveLength(props.items.length);
    });

    it('should apply passed in style props', () => {
        const props = getProps();
        props.titleStyle = { color: 'red' };
        props.itemStyle = { color: 'blue' };
        const wrapper = getWrapper(props);
        expect(wrapper.find('h3').props().style.color).toEqual('red');
        expect(wrapper.find(GridTile).at(1).props().style.color).toEqual('blue');
    });
});
