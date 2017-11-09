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
});
