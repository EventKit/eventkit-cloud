import sinon from 'sinon';
import detector from 'detect-browser';
import * as utils from '../../utils/generic';

describe('test generic utils', () => {
    it('isBrowserValid should return true if browser is not IE', () => {
        const detectorStub = sinon.stub(detector, 'detect')
            .returns({ name: 'chrome' });
        expect(utils.isBrowserValid()).toBe(true);
        detectorStub.restore();
    });

    it('isBrowserValid should return true if IE version is 10 or greater', () => {
        const detectorStub = sinon.stub(detector, 'detect')
            .returns({ name: 'ie', version: '10.0.0' });
        expect(utils.isBrowserValid()).toBe(true);
        detectorStub.restore();
    });

    it('isBrowserValid should return false if IE version is less than 10', () => {
        const detectorStub = sinon.stub(detector, 'detect')
            .returns({ name: 'ie', version: '8.7.5' });
        expect(utils.isBrowserValid()).toBe(false);
        detectorStub.restore();
    });

    it('userIsDataPackAdmin should return true if user has admin member permissions', () => {
        const user = { username: 'user_one' };
        const permissions = {
            value: 'PRIVATE',
            groups: { group_one: 'READ' },
            members: { user_one: 'ADMIN', user_two: 'READ' },
        };
        const groups = [
            { name: 'group_one', administrators: ['user_two'] },
        ];
        const ret = utils.userIsDataPackAdmin(user, permissions, groups);
        expect(ret).toBe(true);
    });

    it('userIsDataPackAdmin should return true if user is admin of a group with admin permission', () => {
        const user = { username: 'user_one' };
        const permissions = {
            value: 'PRIVATE',
            groups: { group_one: 'ADMIN' },
            members: { user_one: 'READ', user_two: 'READ' },
        };
        const groups = [
            { name: 'group_one', administrators: ['user_one'] },
        ];
        const ret = utils.userIsDataPackAdmin(user, permissions, groups);
        expect(ret).toBe(true);
    });

    it('userIsDataPackAdmin should return false if user has no admin permissions', () => {
        const user = { username: 'user_one' };
        const permissions = {
            value: 'PRIVATE',
            groups: { group_one: 'READ' },
            members: { user_one: 'READ', user_two: 'READ' },
        };
        const groups = [
            { name: 'group_one', administrators: ['user_one', 'user_two'] },
        ];
        const ret = utils.userIsDataPackAdmin(user, permissions, groups);
        expect(ret).toBe(false);
    });
});
