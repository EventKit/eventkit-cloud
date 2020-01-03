import * as React from "react";
import {shallow} from "enzyme";
import sinon from 'sinon';
import {DisplayDataBox} from "../../components/CreateDataPack/DisplayDataBox";
import {Card, CardContent, IconButton, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

describe('DisplayDataBox component', () => {
    const getProps = () => ({
        lat: 123.6,
        long: 10.1,
        layerId: 2,
        layerName: 'States',
        displayFieldName: 'state_name',
        value: 'South Dakota',
        closeCard: sinon.spy(),
        handleClose: sinon.spy(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = shallow(<DisplayDataBox {...props} />);
        instance = wrapper.instance();
    };
    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(1);
        expect(wrapper.find(Typography)).toHaveLength(5);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(CloseIcon)).toHaveLength(1);
    });
}
);
