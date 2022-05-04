import { shallow } from "enzyme";
import FootprintDisplay from "../../components/CreateDataPack/FootprintDisplay";
import { FormControlLabel } from "@mui/material";
import Card from "@mui/material/Card";
import ListItemText from "@mui/material/ListItemText";

describe('FootprintDisplay component', () => {

    const getProps = () => ({
            classes: {},
            ...(global as any).eventkit_test_props,
        });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<FootprintDisplay {...props} />).dive();
        instance = wrapper.instance();
    };

    it('should render all the basic components', () => {
        setup();
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(ListItemText)).toHaveLength(1);
        expect(wrapper.find(FormControlLabel)).toHaveLength(1);
    });
});