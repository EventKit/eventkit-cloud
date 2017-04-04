import {expect} from 'chai';
import * as utils from '../utils/sortUtils';

describe('sorting utilities', () => {
    it('orderAZ should return a list sorted A-Z by name', () => {
        const runs = getRuns();
        const unordered_runs = [runs[1], runs[2], runs[0]];
        const ordered_runs = utils.orderAZ(unordered_runs);
        expect(ordered_runs[0].job.name).to.equal('Name 1');
        expect(ordered_runs[1].job.name).to.equal('Name 2');
        expect(ordered_runs[2].job.name).to.equal('Name 3');
    });

    it('orderZA should return a list sorted Z-A by name', () => {
        const runs = getRuns();
        const unordered_runs = [runs[1], runs[0], runs[2]];
        const ordered_runs = utils.orderZA(unordered_runs);
        expect(ordered_runs[0].job.name).to.equal('Name 3');
        expect(ordered_runs[1].job.name).to.equal('Name 2');
        expect(ordered_runs[2].job.name).to.equal('Name 1'); 
    });

    it('ordeOldest should return a list sorted by the started_at date', () => {
        const runs = getRuns();
        const unordered_runs = [runs[1], runs[2], runs[0]];
        const ordered_runs = utils.orderOldest(unordered_runs);
        expect(ordered_runs[0].job.name).to.equal('Name 1');
        expect(ordered_runs[1].job.name).to.equal('Name 2');
        expect(ordered_runs[2].job.name).to.equal('Name 3');
    });

    it('orderNewest should return a list sorted by the started_at date', () => {
        const runs = getRuns();
        const unordered_runs = [runs[2], runs[0], runs[1]];
        const ordered_runs = utils.orderNewest(unordered_runs);
        expect(ordered_runs[0].job.name).to.equal('Name 3');
        expect(ordered_runs[1].job.name).to.equal('Name 2');
        expect(ordered_runs[2].job.name).to.equal('Name 1'); 
    });

    it('myDataPacksOnly should return only runs owned by the specified user', () => {
        const runs = getRuns();
        expect(runs.length).to.equal(3);
        const search = utils.myDataPacksOnly(runs, 'admin');
        expect(search.length).to.equal(2);
        const empty_search = utils.myDataPacksOnly(runs, 'not found');
        expect(empty_search.length).to.equal(0);
    });

    it('search should return run with matching name', () => {
        const runs = getRuns();
        const searched = utils.search('name 1', runs);
        expect(searched.length).to.equal(1);
        expect(searched[0].job.name).to.equal('Name 1');
    });

    it('search should return run with matching event', () => {
        const runs = getRuns();
        const searched = utils.search('event 2', runs);
        expect(searched.length).to.equal(1);
        expect(searched[0].job.event).to.equal('Event 2');
    });

    it('search should return run with matching description', () => {
        const runs = getRuns();
        const searched = utils.search('description 3', runs);
        expect(searched.length).to.equal(1);
        expect(searched[0].job.description).to.equal('Description 3');
    });

    it('search should return mutiple, partial matches', () => {
        const runs = getRuns();
        const searched = utils.search('nam', runs);
        expect(searched.length).to.equal(3);
    });

    it('filterPermissions should return only unpublished runs', () => {
        const runs = getRuns();
        const filtered = utils.filterPermissions('PRIVATE', runs);
        expect(filtered.length).to.equal(1);
        expect(filtered[0].job.published).to.be.false;
    });

    it('filterPermissions should return only published runs', () => {
        const runs = getRuns();
        const filtered = utils.filterPermissions('PUBLIC', runs);
        expect(filtered.length).to.equal(2);
        expect(filtered[0].job.published).to.be.true;
        expect(filtered[1].job.published).to.be.true;
    });

    it('filterStatus should return only runs with COMPLETED  status', () => {
        const runs = getRuns();
        const status = {completed: true, incomplete: false, running: false};
        const filtered = utils.filterStatus(status, runs);
        expect(filtered.length).to.equal(2);
        expect(filtered[0].status).to.equal('COMPLETED');
        expect(filtered[1].status).to.equal('COMPLETED');
    });
    
    it('filterStatus should return only runs with SUBMITTED  status', () => {
        const runs = getRuns();
        const status = {completed: false, incomplete: false, running: true};
        const filtered = utils.filterStatus(status, runs);
        expect(filtered.length).to.equal(1);
        expect(filtered[0].status).to.equal('SUBMITTED');
    });

    it('filterStatus should return only runs with SUBMITTED or COMPLETED status', () => {
        const runs = getRuns();
        const status = {completed: true, incomplete: false, running: true};
        const filtered = utils.filterStatus(status, runs);
        expect(filtered.length).to.equal(3);
        expect(filtered[0].status).to.equal('COMPLETED');
        expect(filtered[2].status).to.equal('COMPLETED');
        expect(filtered[1].status).to.equal('SUBMITTED');
    });

    it('filterDate should return only runs started before maxDate', () => {
        const maxDate = new Date(2017, 2, 30, 14, 6);
        const runs = getRuns();
        const filtered = utils.filterDate(null, maxDate, runs);
        expect(filtered.length).to.equal(2);
        expect(filtered[0].job.name).to.equal('Name 1');
        expect(filtered[1].job.name).to.equal('Name 2');
    });

    it('filterDate should return only runs started after minDate', () => {
        const minDate = new Date(2017, 2, 29, 14, 20);
        const runs = getRuns();
        const filtered = utils.filterDate(minDate, null, runs);
        expect(filtered.length).to.equal(2);
        expect(filtered[0].job.name).to.equal('Name 2');
        expect(filtered[1].job.name).to.equal('Name 3');
    });

    it('filterDate should return only runs started between min and max date', () => {
        const minDate = new Date(2017, 2, 29, 14, 20);
        const maxDate = new Date(2017, 2, 30, 14, 6);
        const runs = getRuns();
        const filtered = utils.filterDate(minDate, maxDate, runs);
        expect(filtered.length).to.equal(1);
        expect(filtered[0].job.name).to.equal('Name 2');
    });
});

const getRuns = () => {
    return [
    {
        "uid": "d2a07afe-a1eb-4805-a464-0e6c97d5a03a",
        "url": "http://cloud.eventkit.dev/api/runs/d2a07afe-a1eb-4805-a464-0e6c97d5a03a",
        "started_at": "2017-03-29T14:10:42.225369Z",
        "finished_at": "2017-03-29T14:10:53.921435Z",
        "duration": "0:00:11.696066",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "2186f03f-41bf-4a3f-8e6e-284109bf61dc",
            "name": "Name 1",
            "event": "Event 1",
            "description": "Description 1",
            "url": "http://cloud.eventkit.dev/api/jobs/2186f03f-41bf-4a3f-8e6e-284109bf61dc",
            "extent": {},
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/d2a07afe-a1eb-4805-a464-0e6c97d5a03a/export-eventkit-20170330.zip",
        "expiration": "2017-04-13T14:10:42.225237Z"
    },
    {
        "uid": "c27ae637-5273-4cd3-97a2-27613aeb41a2",
        "url": "http://cloud.eventkit.dev/api/runs/c27ae637-5273-4cd3-97a2-27613aeb41a2",
        "started_at": "2017-03-30T14:05:15.671825Z",
        "finished_at": "2017-03-30T14:05:29.939941Z",
        "duration": "0:00:14.268116",
        "user": "admin",
        "status": "SUBMITTED",
        "job": {
            "uid": "99372f12-947b-4a41-8dee-24abb7a8afaa",
            "name": "Name 2",
            "event": "Event 2",
            "description": "Description 2",
            "url": "http://cloud.eventkit.dev/api/jobs/99372f12-947b-4a41-8dee-24abb7a8afaa",
            "extent": {},
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/c27ae637-5273-4cd3-97a2-27613aeb41a2/export-eventkit-20170330.zip",
        "expiration": "2017-04-13T14:05:15.671769Z"
    },
    {
        "uid": "d64385a1-347d-419d-b0a9-e8ace6ea5e75",
        "url": "http://cloud.eventkit.dev/api/runs/d64385a1-347d-419d-b0a9-e8ace6ea5e75",
        "started_at": "2017-03-31T12:18:25.580397Z",
        "finished_at": "2017-03-31T12:18:35.914042Z",
        "duration": "0:00:10.333645",
        "user": "notAdmin",
        "status": "COMPLETED",
        "job": {
            "uid": "e209be64-48b5-4598-a4be-73822651cfbd",
            "name": "Name 3",
            "event": "Event 3",
            "description": "Description 3",
            "url": "http://cloud.eventkit.dev/api/jobs/e209be64-48b5-4598-a4be-73822651cfbd",
            "extent": {},
            "published": false
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/d64385a1-347d-419d-b0a9-e8ace6ea5e75/export-eventkit-20170330.zip",
        "expiration": "2017-04-13T12:18:25Z"
    }]
}
