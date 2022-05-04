import sinon from 'sinon';
import { shallow } from 'enzyme';
import ImageCropSquare from '@mui/icons-material/CropSquare';
import ContentClear from '@mui/icons-material/Clear';
import { DrawBoxButton } from '../../components/MapTools/DrawBoxButton';

describe('DrawBoxButton component', () => {

    const getProps = () => ({
        buttonState: 'DEFAULT',
        updateMode: () => {},
        setBoxButtonSelected: () => {},
        setAllButtonsDefault: () => {},
        handleCancel: () => {},
        ...global.eventkit_test_props,
    });

    it('should display the default icon', () => {
        const props = getProps();
        const wrapper = shallow(<DrawBoxButton {...props} />);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ImageCropSquare)).toHaveLength(1);
        expect(wrapper.find('#default_icon')).toHaveLength(1);
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<DrawBoxButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ImageCropSquare)).toHaveLength(1);
        expect(wrapper.find('#inactive_icon')).toHaveLength(1);
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<DrawBoxButton {...props} />);
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
        const wrapper = shallow(<DrawBoxButton {...props} />);
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
        props.setBoxButtonSelected = sinon.spy();
        props.updateMode = sinon.spy();
        const wrapper = shallow(<DrawBoxButton {...props} />);
        wrapper.find('button').simulate('click');
        expect(props.setBoxButtonSelected.calledOnce).toEqual(true);
        expect(props.updateMode.calledOnce).toEqual(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = shallow(<DrawBoxButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setBoxButtonSelected = sinon.spy();
        newProps.updateMode = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(false);
        expect(newProps.handleCancel.calledOnce).toEqual(false);
        expect(newProps.setBoxButtonSelected.calledOnce).toEqual(false);
        expect(newProps.updateMode.calledOnce).toEqual(false);
    });
});
