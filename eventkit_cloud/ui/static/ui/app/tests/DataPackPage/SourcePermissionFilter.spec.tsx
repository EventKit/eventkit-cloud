import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {mount} from "enzyme";
import {SourcePermissionFilter} from "../../components/DataPackPage/SourcePermissionFilter";

jest.mock('../../styles/eventkit_theme.js', () => 'colors');

describe('SourcePermissionFilter component', () => {
    const getProps = () => ({
        classes: {},
        theme: {},
        ...(global as any).eventkit_test_props,
    });

    let wrapper;
    const setup = (propsOverride = {}) => {
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        wrapper = mount(<SourcePermissionFilter {...props} />);
    };

    beforeEach(setup);

    it('should render the initial collapsed elements', () => {
        expect(wrapper.find(RadioGroup)).toHaveLength(1);
        expect(wrapper.find(Radio)).toHaveLength(3);
        expect(wrapper.find(FormControlLabel)).toHaveLength(3);
    });
});
