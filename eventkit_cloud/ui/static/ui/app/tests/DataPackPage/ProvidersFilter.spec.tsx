import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Checkbox from '@material-ui/core/Checkbox';
import { ProvidersFilter } from '../../components/DataPackPage/ProvidersFilter';

describe('ProvidersFilter component', () => {
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
    const getProps = () => ({
        providers,
        selected: {},
        onChange: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ProvidersFilter {...props} />);
    };

    beforeEach(setup);

    it('should have checkboxes', () => {
        expect(wrapper.find('p').first().html()).toContain('Sources');
        expect(wrapper.find('.qa-ProvidersFilter-name').at(0).html()).toContain(providers[0].name);
        expect(wrapper.find(Checkbox).at(0).props().checked).toEqual(false);
    });

    it('should not have checkboxes', () => {
        setup({ providers: [] });
        expect(wrapper.find(Checkbox)).toHaveLength(0);
    });

    it('should call onChange with ("[slug]", true)', () => {
        const input = wrapper.find(Checkbox).at(0);
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toEqual(true);
    });

    it('should set source as checked', () => {
        let input = wrapper.find(Checkbox).at(0);
        expect(input.props().checked).toEqual(false);
        const nextProps = getProps();
        nextProps.selected[providers[0].slug] = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(0);
        expect(input.props().checked).toEqual(true);
    });
});
