import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import DropDownMenu from '../../components/common/DropDownMenu';
import { DataPackSortDropDown } from '../../components/DataPackPage/DataPackSortDropDown';

describe('DataPackSortDropDown component', () => {
    const getProps = () => ({
        handleChange: sinon.spy(),
        value: '-started_at',
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackSortDropDown {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a dropdown menu', () => {
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        expect(wrapper.find(DropDownMenu).props().children).toHaveLength(5);
    });

    it('handleChange should call props.handleChange', () => {
        const value = 'test value';
        instance.handleChange(value);
        expect(props.handleChange.calledWith(value)).toBe(true);
    });

    describe('DropDown should render the correct text based on current value', () => {
        it('should render with text "Newest"', () => {
            expect(wrapper.html()).toContain('Newest');
        });

        it('should render with text "Oldest"', () => {
            wrapper.setProps({ value: 'started_at' });
            expect(wrapper.html()).toContain('Oldest');
        });

        it('should render with text "Name (A-Z)"', () => {
            wrapper.setProps({ value: 'job__name' });
            expect(wrapper.html()).toContain('Name (A-Z)');
        });

        it('should render with text "Name (Z-A)"', () => {
            wrapper.setProps({ value: '-job__name' });
            expect(wrapper.html()).toContain('Name (Z-A)');
        });
    });

    describe('MenuItems should call handle change with correct values', () => {
        let menuItems;
        let changeStub;
        beforeEach(() => {
            menuItems = wrapper.find(DropDownMenu).children();
            changeStub = sinon.stub(instance, 'handleChange');
        });

        it('The first MenuItem should call handleChange with -job__featured', () => {
            menuItems.at(0).props().onClick();
            expect(changeStub.calledOnce).toBe(true);
            expect(changeStub.calledWith('-job__featured')).toBe(true);
        });

        it('The second MenuItem should call handleChange with -started_at', () => {
            menuItems.at(1).props().onClick();
            expect(changeStub.calledOnce).toBe(true);
            expect(changeStub.calledWith('-started_at')).toBe(true);
        });

        it('The third MenuItem should call handleChange with started_at', () => {
            menuItems.at(2).props().onClick();
            expect(changeStub.calledOnce).toBe(true);
            expect(changeStub.calledWith('started_at')).toBe(true);
        });

        it('The fourth MenuItem should call handleChange with job__name', () => {
            menuItems.at(3).props().onClick();
            expect(changeStub.calledOnce).toBe(true);
            expect(changeStub.calledWith('job__name')).toBe(true);
        });

        it('The fifth MenuItem should call handleChange with -job__name', () => {
            menuItems.at(4).props().onClick();
            expect(changeStub.calledOnce).toBe(true);
            expect(changeStub.calledWith('-job__name')).toBe(true);
        });
    });
});
