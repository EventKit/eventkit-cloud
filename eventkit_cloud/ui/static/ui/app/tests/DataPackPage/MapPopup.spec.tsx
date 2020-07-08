import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import Clear from '@material-ui/icons/Clear';
import ArrowDown from '@material-ui/icons/KeyboardArrowDown';
import ArrowUp from '@material-ui/icons/KeyboardArrowUp';
import Dot from '@material-ui/icons/FiberManualRecord';
import { MapPopup } from '../../components/DataPackPage/MapPopup';

describe('LoadButtons component', () => {
    const getProps = () => ({
        featureInfo: {
            name: 'test name',
            job: {
                uid: '111',
                event: 'test event',
                description: 'test description',
            },
            created_at: '2017-03-10T15:52:27.500Z',
            expiration: '2017-03-10T15:52:27.500Z',
            user: 'test user',
        },
        detailUrl: 'cloud.eventkit.test',
        handleZoom: sinon.spy(),
        handlePopupClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides };
        wrapper = shallow(<MapPopup {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find('#popup-header')).toHaveLength(1);
        expect(wrapper.find('#popup-name')).toHaveLength(1);
        expect(wrapper.find('#popup-name').find('a')).toHaveLength(1);
        expect(wrapper.find('#popup-name').find('a').props().href).toEqual(`/status/${props.featureInfo.job.uid}`);
        expect(wrapper.find('#popup-name').html()).toContain('test name');
        expect(wrapper.find(Dot)).toHaveLength(1);
        expect(wrapper.find(Clear)).toHaveLength(1);
        expect(wrapper.find('#popup-event')).toHaveLength(1);
        expect(wrapper.find('#popup-event').html()).toContain('Event: test event');
        expect(wrapper.find('#popup-actions')).toHaveLength(1);
        expect(wrapper.find('#details-url').html()).toContain('Status &amp; Download');
        expect(wrapper.find('#zoom-to').html()).toContain('Zoom To');
        expect(wrapper.find('#show-more').html()).toContain('Show More');
        expect(wrapper.find(ArrowDown)).toHaveLength(1);
        expect(wrapper.find('#moreInfo')).toHaveLength(0);
    });

    it('the moreInfo div should display when user clicks "Show More"', () => {
        const showSpy = sinon.spy(MapPopup.prototype, 'showMore');
        setup();
        wrapper.find('#show-more').simulate('click');
        expect(showSpy.called).toBe(true);
        expect(wrapper.find(ArrowUp)).toHaveLength(1);
        expect(wrapper.find('#moreInfo')).toHaveLength(1);
        expect(wrapper.find('#moreInfo').find('div').at(1).html()).toContain('Description: test description');
        expect(wrapper.find('#moreInfo').find('div').at(2).html()).toContain('Created: 3/10/17');
        expect(wrapper.find('#moreInfo').find('div').at(3).html()).toContain('Expires: 3/10/17');
        expect(wrapper.find('#moreInfo').find('div').at(4).html()).toContain('Owner: test user');
        expect(wrapper.find('#show-more').html()).toContain('Show Less');
        showSpy.restore();
    });

    it('moreInfo should not display null data', () => {
        const p = getProps();
        p.featureInfo.job.description = null;
        p.featureInfo.created_at = null;
        p.featureInfo.expiration = null;
        p.featureInfo.user = null;
        setup(p);
        wrapper.find('#show-more').simulate('click');
        expect(wrapper.find('#moreInfo').html()).toContain('');
    });

    it('should pass detailUrl to button as href', () => {
        expect(wrapper.find('#details-url').props().href).toEqual(props.detailUrl);
    });

    it('should call handleZoom when zoom button is clicked', () => {
        expect(props.handleZoom.notCalled).toBe(true);
        wrapper.find('#zoom-to').simulate('click');
        expect(props.handleZoom.calledOnce).toBe(true);
    });

    it('should call handlePopupClose when a user clicks the close icon', () => {
        expect(props.handlePopupClose.notCalled).toBe(true);
        wrapper.find(Clear).simulate('click');
        expect(props.handlePopupClose.calledOnce).toBe(true);
    });

    it('showMore should toggle the state', () => {
        const stateSpy = sinon.stub(instance, 'setState');
        const initial = wrapper.state('showMore');
        expect(initial).toBe(false);
        instance.showMore();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showMore: !initial })).toBe(true);
    });
});
