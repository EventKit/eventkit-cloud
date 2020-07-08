import * as React from "react";
import {shallow} from "enzyme";
import sinon from 'sinon';
import {QueryDataBox} from "../../components/CreateDataPack/QueryDataBox";
import {Card, CardContent, IconButton, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

describe('QueryDataBox component', () => {
        const getProps = () => ({
            lat: 123.6,
            long: 10.1,
            featureData: {
                layerName: 'States',
                displayFieldName: 'state_name',
                value: 'South Dakota',
                layerId: 2,
            },
            closeCard: false,
            handleClose: sinon.spy(),
            classes: {},
            ...(global as any).eventkit_test_props,
        });

        let props;
        let wrapper;
        let instance;
        const setup = (overrides = {}) => {
            props = { ...getProps(), ...overrides };
            wrapper = shallow(<QueryDataBox {...props} />);
            instance = wrapper.instance();
        };
        beforeEach(setup);

        it('should render all the basic components', () => {
            // 11 Typography's, 2 for each key value pair in feature data, one for the box header.
            expect(wrapper.find(Typography)).toHaveLength(11);
            expect(wrapper.find(IconButton)).toHaveLength(1);
            expect(wrapper.find(CloseIcon)).toHaveLength(1);
        });

        it('should fire the handleClose function when the close icon is clicked', () => {
            props.handleClose = sinon.spy();
            setup();
            expect(props.handleClose.notCalled).toBe(true);
            wrapper.find(IconButton).at(0).simulate('click');
            expect(props.handleClose.calledOnce).toBe(true);
        });

    it('should render single empty div when closeCard is true', () => {
        setup({closeCard: true});
        expect(wrapper.find('div')).toHaveLength(1);
    });
    }
);
