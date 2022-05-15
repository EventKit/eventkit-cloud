import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Checkbox from '@material-ui/core/Checkbox';
import { FormatsFilter } from '../../components/DataPackPage/FormatsFilter';

describe('FormatsFilter component', () => {
    const formats = [
        {
            slug: 'fmt1',
            name: 'Format One',
            description: 'The first format for testing',
            uid: '12346',
        },
    ];
    const getProps = () => ({
        formats,
        selected: {},
        onChange: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<FormatsFilter {...props} />);
    };

    beforeEach(setup);

    it('should have checkboxes', () => {
        expect(wrapper.find('p').first().html()).toContain('Formats');
        expect(wrapper.find('.qa-FormatsFilter-name').at(0).html()).toContain(formats[0].name);
        expect(wrapper.find(Checkbox).at(0).props().checked).toEqual(false);
    });

    it('should not have checkboxes', () => {
        setup({ formats: [] });
        expect(wrapper.find(Checkbox)).toHaveLength(0);
    });

    it('should call onChange with ("[slug]", true)', () => {
        const input = wrapper.find(Checkbox).at(0);
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toEqual(true);
    });

    it('should set format as checked', () => {
        let input = wrapper.find(Checkbox).at(0);
        expect(input.props().checked).toEqual(false);
        const nextProps = getProps();
        nextProps.selected[formats[0].slug] = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(0);
        expect(input.props().checked).toEqual(true);
    });
});
