import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import ActionSearch from '@material-ui/icons/Search';
import ContentClear from '@material-ui/icons/Clear';
import { SearchAOIButton } from '../../components/MapTools/SearchAOIButton';

describe('SearchAOIButton component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        buttonState: 'DEFAULT',
        handleCancel: () => {},
        setSearchAOIButtonSelected: () => {},
        setAllButtonsDefault: () => {},
        ...global.eventkit_test_props,
    });
    it('should render its default state', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIButton {...props} />);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSearch)).toHaveLength(1);
        expect(wrapper.find('#default_icon')).toHaveLength(1);
        expect(wrapper.find('#default_icon').text()).toContain('SEARCH');
    });

    it('should render its inactive state', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIButton {...props} />);
        const nextProps = getProps();
        nextProps.buttonState = 'INACTIVE';
        wrapper.setProps(nextProps);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSearch)).toHaveLength(1);
        expect(wrapper.find('#inactive_icon')).toHaveLength(1);
        expect(wrapper.find('#inactive_icon').text()).toContain('SEARCH');
    });

    it('should render its active state', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIButton {...props} />);
        const nextProps = getProps();
        nextProps.buttonState = 'SELECTED';
        wrapper.setProps(nextProps);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find('#selected_icon')).toHaveLength(1);
        expect(wrapper.find('#selected_icon').text()).toContain('SEARCH');
    });

    it('should handle onClick', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIButton {...props} />);
        const nextProps = getProps();
        nextProps.buttonState = 'SELECTED';
        nextProps.handleCancel = sinon.spy();
        nextProps.setAllButtonsDefault = sinon.spy();
        wrapper.setProps(nextProps);
        wrapper.find('button').simulate('click');
        expect(nextProps.handleCancel.calledOnce).toBe(true);
        expect(nextProps.setAllButtonsDefault.calledOnce).toBe(true);
    });

    it('should do nothing onClick when inactive', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIButton {...props} />);
        const nextProps = getProps();
        nextProps.buttonState = 'INACTIVE';
        nextProps.handleCancel = sinon.spy();
        nextProps.setAllButtonsDefault = sinon.spy();
        wrapper.setProps(nextProps);
        wrapper.find('button').simulate('click');
        expect(nextProps.handleCancel.calledOnce).toBe(false);
        expect(nextProps.setAllButtonsDefault.calledOnce).toBe(false);
    });
});
