import { shallow } from "enzyme";
import * as React from "react";
import FootprintDisplay from "../../components/CreateDataPack/FootprintDisplay";
import { FormControlLabel } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import ListItemText from "@material-ui/core/ListItemText";

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