import * as viewport from '../../utils/viewport';

describe('viewport utils', () => {
    const xsMax = viewport.XS_MAX_WIDTH;
    const sMax = viewport.S_MAX_WIDTH;
    const mMax = viewport.M_MAX_WIDTH;
    const lMax = viewport.L_MAX_WIDTH;

    it('isViewportXS should return true', () => {
        window.resizeTo(xsMax - 1, xsMax - 1);
        expect(viewport.isViewportXS()).toBe(true);
    });

    it('isViewportXS should return false, isViewportS should return true', () => {
        window.resizeTo(sMax - 1, sMax - 1);
        expect(viewport.isViewportXS()).toBe(false);
        expect(viewport.isViewportS()).toBe(true);
    });

    it('isViewportS should return false, isViewportM should return true', () => {
        window.resizeTo(mMax - 1, mMax - 1);
        expect(viewport.isViewportS()).toBe(false);
        expect(viewport.isViewportM()).toBe(true);
    });

    it('isViewportM should return false, isViewportL should return true', () => {
        window.resizeTo(lMax - 1, lMax - 1);
        expect(viewport.isViewportM()).toBe(false);
        expect(viewport.isViewportL()).toBe(true);
    });

    it('isViewportL should return false, isViewportXL should return true', () => {
        window.resizeTo(lMax + 1, lMax + 1);
        expect(viewport.isViewportL()).toBe(false);
        expect(viewport.isViewportXL()).toBe(true);
    });
});
