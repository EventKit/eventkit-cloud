import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import moment from 'moment';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Card, CardTitle, CardText } from 'material-ui/Card';
import { DataPackFeaturedItem } from '../../components/DashboardPage/DataPackFeaturedItem';

describe('DataPackFeaturedItem component', () => {
    const muiTheme = getMuiTheme();

    beforeAll(() => {
        DataPackFeaturedItem.prototype.initMap = sinon.spy();
    });

    afterAll(() => {
        DataPackFeaturedItem.prototype.initMap.restore();
    });

    function getProps() {
        return {
            run: {
                uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                started_at: '2017-03-10T15:52:35.637331Z',
                finished_at: '2017-03-10T15:52:39.837Z',
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

    function getMountedWrapper(props = getProps()) {
        return mount(<DataPackFeaturedItem {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
    }

    it('should display general run information', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardTitle)).toHaveLength(1);
        expect(wrapper.find(CardTitle).find('span').first()
            .childAt(0)
            .childAt(0)
            .text()).toEqual(props.run.job.name);
        const subtitle = wrapper.find(CardTitle).childAt(1).childAt(0);
        expect(subtitle.find('div').at(1).text()).toEqual(`Event: ${props.run.job.event}`);
        expect(subtitle.find('span').at(0).text()).toEqual(`Added: ${moment(props.run.started_at).format('YYYY-MM-DD')}`);
        expect(subtitle.find('span').at(1).text()).toEqual(`Expires: ${moment(props.run.expiration).format('YYYY-MM-DD')}`);
        expect(wrapper.find(CardText)).toHaveLength(1);
        expect(wrapper.find(CardText).find('span').text()).toEqual(props.run.job.description);
    });
});
