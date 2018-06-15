import React from 'react';
import { Link } from 'react-router';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import moment from 'moment';
import { CardTitle, CardText } from 'material-ui/Card';
import { DataPackFeaturedItem } from '../../components/DashboardPage/DataPackFeaturedItem';

describe('DataPackFeaturedItem component', () => {
    let props;
    let wrapper;
    let instance;

    beforeAll(() => {
        DataPackFeaturedItem.prototype.initMap = sinon.spy();
    });

    afterAll(() => {
        DataPackFeaturedItem.prototype.initMap.restore();
    });

    beforeEach(() => {
        props = {};
        wrapper = null;
        instance = null;
    });

    function shallowWrapper(props) {
        return shallow(<DataPackFeaturedItem { ...props } />);
    }

    function wrapShallow(element) {
        return shallow(<div>{element}</div>).childAt(0);
    }

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
        };
    }

    describe('basic state', () => {
        beforeEach(() => {
            props = defaultProps();
            wrapper = shallowWrapper(props);
            instance = wrapper.instance();
        });

        it('renders card title with correct text and props', () => {
            const cardTitle = wrapper.find(CardTitle);
            const title = wrapShallow(cardTitle.props().title);
            const titleLink = title.find(Link);
            expect(titleLink.props().to).toBe(`/status/${instance.props.run.job.uid}`);
            expect(titleLink.props().href).toBe(`/status/${instance.props.run.job.uid}`);
            expect(titleLink.childAt(0).text()).toBe(instance.props.run.job.name);
        });

        it('renders card subtitle with correct text', () => {
            const cardTitle = wrapper.find(CardTitle);
            const subtitle = wrapShallow(cardTitle.props().subtitle);
            expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Event').text()).toBe(`Event: ${instance.props.run.job.event}`);
            expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Added').text()).toBe(`Added: ${moment(instance.props.run.started_at).format('YYYY-MM-DD')}`);
            expect(subtitle.find('.qa-DataPackFeaturedItem-Subtitle-Expires').text()).toBe(`Expires: ${moment(instance.props.run.expiration).format('YYYY-MM-DD')}`);
        });

        it('renders card text with the job description', () => {
            expect(wrapper.find(CardText).childAt(0).text()).toBe(instance.props.run.job.description);
        });

        it('inits map on component mount', () => {
            instance.initMap = sinon.spy();
            instance.componentDidMount();
            expect(instance.initMap.callCount).toBe(1);
        });

        it('gets the map id', () => {
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
});
