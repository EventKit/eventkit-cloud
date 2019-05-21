import * as  React from 'react';
import { Link } from 'react-router';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import * as moment from 'moment';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import { DataPackFeaturedItem } from '../../components/DashboardPage/DataPackFeaturedItem';

describe('DataPackFeaturedItem component', () => {
    let wrapper;
    let instance;

    function defaultProps() {
        return {
            run: {
                uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                started_at: '2017-03-10T15:52:35.637331Z',
                job: {
                    uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                    name: 'Test1',
                    event: 'Test1 event',
                    description: 'Test1 description',
                },
                expiration: '2017-03-24T15:52:35.637258Z',
            },
            gridName: 'test',
            index: 0,
            classes: {},
            ...(global as any).eventkit_test_props,
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<DataPackFeaturedItem {...props} />, {
            context: { config: { BASEMAP_URL: 'some url' } },
        });
        instance = wrapper.instance();
    }

    function wrapShallow(element) {
        return shallow(<div>{element}</div>).childAt(0);
    }

    beforeAll(() => {
        sinon.stub(DataPackFeaturedItem.prototype, 'initMap');
    });

    beforeEach(setup);

    it('renders card title with correct text and props', () => {
        const title = wrapShallow(wrapper.find(CardHeader).props().title);
        const titleLink = title.find(Link);
        expect(titleLink.props().to).toBe(`/status/${instance.props.run.job.uid}`);
        expect(titleLink.props().href).toBe(`/status/${instance.props.run.job.uid}`);
        expect(titleLink.childAt(0).text()).toBe(instance.props.run.job.name);
    });

    it('renders card subtitle with correct text', () => {
        const subtitle = wrapShallow(wrapper.find(CardHeader).props().subheader);
        expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Event').text()).toBe(
            `Event: ${instance.props.run.job.event}`,
        );
        expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Added').text()).toBe(
            `Added: ${moment(instance.props.run.started_at).format('M/D/YY')}`,
        );
        expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Expires').text()).toBe(
            `Expires: ${moment(instance.props.run.expiration).format('M/D/YY')}`,
        );
    });

    it('renders card text with the job description', () => {
        expect(wrapper.find(CardContent).childAt(0).text()).toBe(instance.props.run.job.description);
    });

    it('inits map on component mount', () => {
        instance.initMap = sinon.spy();
        instance.componentDidMount();
        expect(instance.initMap.callCount).toBe(1);
    });

    it('gets the correct map id', () => {
        expect(instance.getMapId()).toBe(`${instance.props.gridName}_${instance.props.run.uid}_${instance.props.index}_map`);
        wrapper.setProps({ gridName: undefined });
        expect(instance.getMapId()).toBe(`${instance.props.run.uid}_${instance.props.index}_map`);
        wrapper.setProps({ index: undefined });
        expect(instance.getMapId()).toBe(`${instance.props.run.uid}_map`);
        wrapper.setProps({ gridName: 'test' });
        expect(instance.getMapId()).toBe(`${instance.props.gridName}_${instance.props.run.uid}_map`);
    });

    it('absorbs touch move events on the map', () => {
        const element = {
            addEventListener: sinon.spy(),
        };
        instance.mapContainerRef(element);
        expect(element.addEventListener.callCount).toBe(1);
        expect(element.addEventListener.calledWith('touchmove')).toBe(true);
    });
});
