import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../actions/mapToolActions';
import nock from 'nock';
import sinon from 'sinon';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mapTool actions', () => {

    it('setBoxButtonSelected should return type SET_BOX_SELECTED', ()=> {
        expect(actions.setBoxButtonSelected()).toEqual({
            type: 'SET_BOX_SELECTED'
        })
    });

    it('setFreeButtonSelected should return type SET_FREE_SELECTED', () => {
        expect(actions.setFreeButtonSelected()).toEqual({
            type: 'SET_FREE_SELECTED'
        });
    });

    it('setMapViewButtonSelected should return type SET_VIEW_SELECTED', () => {
        expect(actions.setMapViewButtonSelected()).toEqual({
            type: 'SET_VIEW_SELECTED'
        });
    });

    it('setImportButtonSelected should return type SET_IMPORT_SELECTED', () => {
        expect(actions.setImportButtonSelected()).toEqual({
            type: 'SET_IMPORT_SELECTED'
        });
    });

    it('setAllButtonsDefault should return type SET_BUTTONS_DEFAULT', () => {
        expect(actions.setAllButtonsDefault()).toEqual({
            type: 'SET_BUTTONS_DEFAULT'
        });
    });

    it('setImportModalState should return type SET_IMPORT_MODAL_STATE and the passed in bool', () => {
        expect(actions.setImportModalState(true)).toEqual({
            type: 'SET_IMPORT_MODAL_STATE',
            showImportModal: true,
        });
    });

    it('resetGeoJSONFile should return type FILE_RESET', () => {
        expect(actions.resetGeoJSONFile()).toEqual({
            type: 'FILE_RESET'
        });
    });
});
