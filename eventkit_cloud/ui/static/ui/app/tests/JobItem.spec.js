import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount} from 'enzyme';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import {JobItem} from '../components/JobItem';
import IconButton from 'material-ui/IconButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Card, CardActions, CardMedia, CardTitle, CardText} from 'material-ui/Card';

describe('JobItem component', () => {
    injectTapEventPlugin();

    const muiTheme = getMuiTheme();

    it('should display general job information', () => {
        const props = {job: getJobs()[0]};
        const wrapper = mount(<JobItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(Card)).to.have.length(1);
        expect(wrapper.find(CardTitle)).to.have.length(1);
        expect(wrapper.find(CardTitle).find('span').first()
            .childAt(0).childAt(0).text()).to.equal('Test1');
        expect(wrapper.find(IconMenu)).to.have.length(1);
        expect(wrapper.find(IconButton)).to.have.length(1);
        expect(wrapper.find(IconButton).find('i').text()).to.equal('more_vert');
        expect(wrapper.find(MenuItem)).to.have.length(0);
        const subtitle = wrapper.find(CardTitle).childAt(1).childAt(0);
        expect(subtitle.find('span').first().text()).to.equal('Event: Test1 event');
        expect(subtitle.find('span').last().text()).to.equal('Added: 2017-02-16');
        expect(wrapper.find(CardText)).to.have.length(1);
        expect(wrapper.find(CardText).find('span').text()).to.equal('Test1 description');
        expect(wrapper.find(CardMedia)).to.have.length(0);
        expect(wrapper.find(CardActions)).to.have.length(1);
    });

    it('should display information specific to a unpublished & owned job', () => {
        const props = {job: getJobs()[0]};
        const wrapper = mount(<JobItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(CardActions).find('i').text()).to.equal('person');
        expect(wrapper.find(CardActions).find('p').text()).to.equal('My DataPack');
    });

    it('should display information specific to a published & owned job', () => {
        const props = {job: getJobs()[2]};
        const wrapper = mount(<JobItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(CardActions).find('i').text()).to.equal('group');
        expect(wrapper.find(CardActions).find('p').text()).to.equal('My DataPack');
    });

    it('should display information specific to a published & stranger job', () => {
        const props = {job: getJobs()[1]};
        const wrapper = mount(<JobItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(CardActions).find('i').text()).to.equal('group');
        expect(wrapper.find(CardActions).find('p').text()).to.equal('stranger');
    });

    it('should display a map when the card is expanded', () => {
        const props = {job: getJobs()[0]};
        const uid = props.job.uid;
        const wrapper = mount(<JobItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const updateSpy = new sinon.spy(JobItem.prototype, 'componentDidUpdate');
        wrapper.instance().initMap = sinon.spy();
        expect(wrapper.find('#' + uid + '_map')).to.have.length(0);
        wrapper.setState({expanded: true});
        expect(wrapper.find(CardMedia)).to.have.length(1);        
        expect(updateSpy.called).to.be.true;
        expect(wrapper.instance().initMap.called).to.be.true;
        expect(wrapper.find('#' + uid + '_map')).to.have.length(1);
    });
});

function getJobs() {
    return [{
        "uid": "83cd02d4-5249-48ef-b019-48e81a8df411",
        "url": "https://cloud.eventkit.dev/api/jobs/83cd02d4-5249-48ef-b019-48e81a8df411",
        "name": "Test1",
        "description": "Test1 description",
        "event": "Test1 event",
        "created_at": "2017-02-16T22:26:01.498628Z",
        "owner": "owner",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Test1",
                "uid": "83cd02d4-5249-48ef-b019-48e81a8df411"
            },
            "geometry": {
                "coordinates": [
                    [[29.764538,9.203782],
                    [29.764538,9.306116],
                    [29.841785,9.306116],
                    [29.841785,9.203782],
                    [29.764538,9.203782]]],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": false
    },
    {
        "uid": "4a5a805f-b7a4-428c-b4d9-0a273e6f9013",
        "url": "https://cloud.eventkit.dev/api/jobs/4a5a805f-b7a4-428c-b4d9-0a273e6f9013",
        "name": "Test2",
        "description": "Test2 description",
        "event": "Test2 event",
        "created_at": "2017-02-16T17:52:07.027265Z",
        "owner": "stranger",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Test2",
                "uid": "4a5a805f-b7a4-428c-b4d9-0a273e6f9013"
            },
            "geometry": {
                "coordinates": [
                    [[36.62138,34.641682],
                    [36.62138,34.805629],
                    [36.793728,34.805629],
                    [36.793728,34.641682],
                    [36.62138,34.641682]]],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": true
    },
    {
        "uid": "c9f9f98c-2522-41eb-9296-7a2a0f14b3c8",
        "url": "https://cloud.eventkit.dev/api/jobs/c9f9f98c-2522-41eb-9296-7a2a0f14b3c8",
        "name": "Test3",
        "description": "Test3 description",
        "event": "Test3 event",
        "created_at": "2017-02-16T16:59:07.408367Z",
        "owner": "owner",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Test3",
                "uid": "c9f9f98c-2522-41eb-9296-7a2a0f14b3c8"
            },
            "geometry": {
                "coordinates": [
                    [[36.62138,34.641682],
                    [36.62138,34.805629],
                    [36.793728,34.805629],
                    [36.793728,34.641682],
                    [36.62138,34.641682]]],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": true
    },]
}
