import {IconButton, Popover, Typography} from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import {mount} from "enzyme";
import {act} from "react-dom/test-utils";
import {UnavailableFilterPopup} from "../../components/DataPackPage/UnavailableFilterPopup";

jest.mock('../../styles/eventkit_theme.js', () => 'colors');

describe('UnavailableFilterPopup component', () => {
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
        wrapper = mount(<UnavailableFilterPopup {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the initial collapsed elements', () => {
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(WarningIcon)).toHaveLength(1);
        expect(wrapper.find(Popover)).toHaveLength(1);
        expect(wrapper.find(CloseIcon)).toHaveLength(0);
    });
    it('handlePopoverOpen should open the popover', () => {
        expect(wrapper.find(Popover).props().open).toBe(false);
        expect(wrapper.find(IconButton).at(0).exists()).toBe(true);

        act(() => {
            wrapper
                .find(IconButton)
                .first()
                .simulate("click");
        });
        wrapper.update();
        console.log(wrapper.debug());
        expect(wrapper.find(Popover).props().open).toBe(true);
    });
    it('handleCloseExpand should close the popover', () => {
        expect(wrapper.find(IconButton).at(1).exists()).toBe(false);
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
