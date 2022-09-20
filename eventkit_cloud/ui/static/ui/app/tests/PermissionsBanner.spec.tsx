import * as sinon from 'sinon';
import PermissionsBanner from "../components/PermissionsBanner";
import {ButtonBase, Grid, Paper} from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CloseIcon from '@material-ui/icons/Close';
import {mount} from "enzyme";
import {act} from "react-dom/test-utils";

describe('PermissionsBanner component', () => {
    let wrapper;

    const getProps = () => ({
        handleClosedPermissionsBanner: sinon.stub(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        wrapper = mount(<PermissionsBanner {...props} />);
    };

    beforeEach(setup);

    it('should render the initial collapsed elements', () => {
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(Grid)).toHaveLength(3);
        expect(wrapper.find(ButtonBase)).toHaveLength(2);
        expect(wrapper.find(ExpandMoreIcon)).toHaveLength(1);
        expect(wrapper.find(ExpandLessIcon)).toHaveLength(0);
        expect(wrapper.find(CloseIcon)).toHaveLength(1);
    });

    it('handleExpand should change the expand more btn to be an expand less btn', () => {
        expect(wrapper.find(ExpandMoreIcon).exists()).toBe(true);

        act(() => {
            wrapper
                .find(ButtonBase)
                .first()
                .simulate("click");
        });
        wrapper.update();
        expect(wrapper.find(ExpandLessIcon).exists()).toBe(true);
    });
    it('handleCloseExpand should change the expand less btn to be an expand more btn', () => {
        act(() => {
            wrapper
                .find(ButtonBase)
                .first()
                .simulate("click");
        });
        wrapper.update();

        act(() => {
            wrapper
                .find(ButtonBase)
                .at(0)
                .simulate("click");
        });
        wrapper.update();
        expect(wrapper.find(ExpandMoreIcon).exists()).toBe(true);
        expect(wrapper.find(ExpandLessIcon).exists()).toBe(false);
    });
    it('clicking on the close icon btn should trigger the handleClosedPermissionsBanner function', () => {
        const mockFunction = jest.fn();
        const component = mount(
            <PermissionsBanner handleClosedPermissionsBanner={mockFunction}/>
        );
        expect(component.find(PermissionsBanner).exists()).toBe(true);

        act(() => {
            component
                .find(ButtonBase)
                .at(1)
                .simulate("click");
        });
        component.update();
        expect(mockFunction).toHaveBeenCalled();
    });
});
