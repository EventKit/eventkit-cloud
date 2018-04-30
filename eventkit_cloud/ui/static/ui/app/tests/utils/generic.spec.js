import sinon from 'sinon';
import GeoJSON from 'ol/format/geojson';
import Feature from 'ol/feature';
import * as utils from '../../utils/generic';

describe('test generic utils', () => {
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

    it('getSqKm should reading geojson and calculate total area', () => {
        const geojson = { type: 'FeatureCollection', features: [] };
        const feature = new Feature();
        const getArea = () => 5000000;
        feature.getGeometry = () => ({ getArea });
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const area = utils.getSqKm(geojson);
        expect(area).toEqual(5);
        readStub.restore();
    });

    it('getSqKmString should call getSqKm and return a formated string', () => {
        expect(utils.getSqKmString({ type: 'FeatureCollection', features: [] })).toEqual('0 sq km');
    });
});
