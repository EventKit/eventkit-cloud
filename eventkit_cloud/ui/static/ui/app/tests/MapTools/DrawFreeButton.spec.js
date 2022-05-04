import sinon from 'sinon';
import { shallow } from 'enzyme';
import ContentCreate from '@mui/icons-material/Create';
import ContentClear from '@mui/icons-material/Clear';
import { DrawFreeButton } from '../../components/MapTools/DrawFreeButton';

describe('DrawFreeButton component', () => {

    const getProps = () => ({
        buttonState: 'DEFAULT',
        updateMode: () => {},
        setFreeButtonSelected: () => {},
        setAllButtonsDefault: () => {},
        handleCancel: () => {},
        ...global.eventkit_test_props,
    });

    it('should display the default icon', () => {
        const props = getProps();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentCreate)).toHaveLength(1);
        expect(wrapper.find('#default_icon')).toHaveLength(1);
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentCreate)).toHaveLength(1);
        expect(wrapper.find('#inactive_icon')).toHaveLength(1);
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'SELECTED';
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find('#selected_icon')).toHaveLength(1);
    });

    it('should handleOnClick when icon is in SELECTED state', () => {
        const props = getProps();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'SELECTED';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        wrapper.setProps(newProps);
        wrapper.find('button').simulate('click');
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(true);
        expect(newProps.handleCancel.calledOnce).toEqual(true);
    });

    it('should handleOnClick when icon is in DEFAULT state', () => {
        const props = getProps();
        props.setFreeButtonSelected = sinon.spy();
        props.updateMode = sinon.spy();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        wrapper.find('button').simulate('click');
        expect(props.setFreeButtonSelected.calledOnce).toEqual(true);
        expect(props.updateMode.calledOnce).toEqual(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = shallow(<DrawFreeButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setFreeButtonSelected = sinon.spy();
        newProps.updateMode = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(false);
        expect(newProps.handleCancel.calledOnce).toEqual(false);
        expect(newProps.setFreeButtonSelected.calledOnce).toEqual(false);
        expect(newProps.updateMode.calledOnce).toEqual(false);
    });
});
