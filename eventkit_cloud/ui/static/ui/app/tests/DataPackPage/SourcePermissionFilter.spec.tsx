import React from 'react';
import * as sinon from 'sinon';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CheckCircle from '@material-ui/icons/CheckCircle';
import {mount} from "enzyme";
import {act} from "react-dom/test-utils";
import {SourcePermissionFilter} from "../../components/DataPackPage/SourcePermissionFilter";

jest.mock('../../styles/eventkit_theme.js', () => 'colors');

describe('PermissionsBanner component', () => {
    const getProps = () => ({
        classes: {},
        theme: {},
        ...(global as any).eventkit_test_props,
    });

    let wrapper;
    let instance;
    const setup = (propsOverride = {}) => {
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        wrapper = mount(<SourcePermissionFilter {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the initial collapsed elements', () => {
        console.log(wrapper.debug());
        expect(wrapper.find(RadioGroup)).toHaveLength(1);
        expect(wrapper.find(Radio)).toHaveLength(3);
        expect(wrapper.find(FormControlLabel)).toHaveLength(3);
    });
    // it('handleExpand should change the expand more btn to be an expand less btn', () => {
    //     expect(wrapper.find(PermissionsBanner).props().isOpen).toBe(false);
    //     expect(wrapper.find(ExpandMoreIcon).exists()).toBe(true);
    //
    //     act(() => {
    //         wrapper
    //             .find(ButtonBase)
    //             .first()
    //             .simulate("click");
    //     });
    //     wrapper.update();
    //     expect(wrapper.find(ExpandLessIcon).exists()).toBe(true);
    // });
    // it('handleCloseExpand should change the expand less btn to be an expand more btn', () => {
    //     act(() => {
    //         wrapper
    //             .find(ButtonBase)
    //             .first()
    //             .simulate("click");
    //     });
    //     wrapper.update();
    //
    //     act(() => {
    //         wrapper
    //             .find(ButtonBase)
    //             .at(0)
    //             .simulate("click");
    //     });
    //     wrapper.update();
    //     expect(wrapper.find(ExpandMoreIcon).exists()).toBe(true);
    //     expect(wrapper.find(ExpandLessIcon).exists()).toBe(false);
    // });
});
