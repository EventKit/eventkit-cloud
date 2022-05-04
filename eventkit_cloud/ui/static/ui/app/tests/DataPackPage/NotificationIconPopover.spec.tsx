import {IconButton, Popover} from "@mui/material";
import {mount} from "enzyme";
import {act} from "react-dom/test-utils";
import {NotificationIconPopover} from "../../components/DataPackPage/NotificationIconPopover";

jest.mock('../../styles/eventkit_theme.js', () => ({
        eventkit: {
            images: {},
            colors: {}
        }
    })
);

describe('NotificationIconPopover component', () => {
    let wrapper;

    const getProps = () => ({
        view: 'groups',
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        wrapper = mount(<NotificationIconPopover {...props} />);
    };

    beforeEach(setup);

    it('should render the initial elements', () => {
        console.log(wrapper.debug());
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(Popover)).toHaveLength(1);
    });
    it('clicking on the close icon btn should trigger handlePopoverClose() and close popover', () => {
        expect(wrapper.find(Popover).props().open).toBe(false);

        act(() => {
            wrapper
                .find(IconButton)
                .first()
                .simulate("click");
        });
        wrapper.update();
        expect(wrapper.find(IconButton).at(1).exists()).toBe(true);

        act(() => {
            wrapper
                .find(IconButton)
                .at(1)
                .simulate("click");
        });
        wrapper.update();
        expect(wrapper.find(Popover).props().open).toBe(false);
    });
});
