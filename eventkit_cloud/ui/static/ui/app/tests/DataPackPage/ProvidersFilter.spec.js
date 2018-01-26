import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Checkbox from 'material-ui/Checkbox';
import { ProvidersFilter } from '../../components/DataPackPage/ProvidersFilter';

describe('ProvidersFilter component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const providers = [
        {
            "id": 2,
            "model_url": "http://cloud.eventkit.dev/api/providers/osm",
            "type": "osm",
            "license": null,
            "created_at": "2017-08-15T19:25:10.844911Z",
            "updated_at": "2017-08-15T19:25:10.844919Z",
            "uid": "bc9a834a-727a-4779-8679-2500880a8526",
            "name": "OpenStreetMap Data (Themes)",
            "slug": "osm",
            "preview_url": "",
            "service_copyright": "",
            "service_description": "OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).",
            "layer": null,
            "level_from": 0,
            "level_to": 10,
            "zip": false,
            "display": true,
            "export_provider_type": 2
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
        props.providers = null;
        const wrapper = getWrapper(props);
        expect(wrapper.find(Checkbox)).toHaveLength(0);
    });

    it('should call onChange with ("[slug]", true)', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(0).find('input');
        input.node.checked = true;
        input.simulate('change');
        expect(props.onChange.calledOnce).toEqual(true);
        expect(props.onChange.args[0][0]).toEqual(providers[0].slug);
        expect(props.onChange.args[0][1]).toEqual(true);
    });

    it('should set source as checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.node.checked).toEqual(false);
        const nextProps = getProps();
        nextProps.selected[providers[0].slug] = true;
        wrapper.setProps(nextProps);
        expect(input.node.checked).toEqual(true);
    });
});
