import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Checkbox from 'material-ui/Checkbox';
import { ProvidersFilter } from '../../components/DataPackPage/ProvidersFilter';

describe('ProvidersFilter component', () => {
    const muiTheme = getMuiTheme();
    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'OpenStreetMap vector data.',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];
    const getProps = () => (
        {
            providers,
            selected: {},
            onChange: () => {},
        }
    );

    const getWrapper = props => (
        mount(<ProvidersFilter {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should have checkboxes', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('p').first().text()).toEqual('Sources');
        expect(wrapper.find(Checkbox).at(0).text()).toEqual(providers[0].name);
        expect(wrapper.find(Checkbox).at(0).props().checked).toEqual(false);
    });

    it('should not have checkboxes', () => {
        const props = getProps();
        props.providers = [];
        const wrapper = getWrapper(props);
        expect(wrapper.find(Checkbox)).toHaveLength(0);
    });

    it('should call onChange with ("[slug]", true)', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(0).find('input');
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toEqual(true);
    });

    it('should set source as checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.props().checked).toEqual(false);
        const nextProps = getProps();
        nextProps.selected[providers[0].slug] = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.props().checked).toEqual(true);
    });
});
