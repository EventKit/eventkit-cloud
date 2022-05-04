import * as sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import AlertWarning from '@mui/icons-material/Warning';
import ImageCropSquare from '@mui/icons-material/CropSquare';
import ActionRoom from '@mui/icons-material/Room';
import ActionZoomIn from '@mui/icons-material/ZoomIn';
import Line from '@mui/icons-material/Timeline';
import Extent from '@mui/icons-material/SettingsOverscan';
import IrregularPolygon from '../../components/icons/IrregularPolygon';
import {AoiInfobar, getIcon} from '../../components/CreateDataPack/AoiInfobar';
import {JobValidationProvider} from "../../components/CreateDataPack/context/JobValidation";
import {ProviderLimits} from "../../components/CreateDataPack/EstimateContainer";

describe('AoiInfobar component', () => {
    const getProps = () => ({
        aoiInfo: {
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            buffer: 0,
        },
        showAlert: false,
        showRevert: false,
        onRevertClick: sinon.spy(),
        clickZoomToSelection: sinon.spy(),
        handleBufferClick: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, area = 100) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(
            <JobValidationProvider value={{
                providerLimits: [{ maxDataSize: 100, maxArea: 100, slug: 'osm' } as ProviderLimits],
                aoiHasArea: true,
                aoiArea: area,
                aoiBboxArea: area,
                dataSizeInfo: {} as any,
                isCollectingEstimates: false,
            }}>
                <AoiInfobar {...props} />
            </JobValidationProvider>);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [100.0, 0.0],
                        [101.0, 0.0],
                        [101.0, 1.0],
                        [100.0, 1.0],
                        [100.0, 0.0],
                    ]],
                },
            },
        ],
    };

    it('should not display the infobar by default', () => {
        expect(wrapper.find('.qa-AoiInfobar')).toHaveLength(0);
    });

    it('should show aoiInfo', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: 'fake title',
        };
        setup({ aoiInfo });
        expect(wrapper.find('.qa-AoiInfoBar-container')).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-title').text()).toEqual('AREA OF INTEREST (AOI)');
        expect(wrapper.find('.qa-AoiInfobar-button-zoom')).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-button-zoom').first().text()).toContain(' ZOOM TO');
        expect(wrapper.find(ActionZoomIn)).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-infoTitle').text()).toEqual('fake title');
        expect(wrapper.find('.qa-AoiInfobar-infoDescription').text()).toEqual('fake description');
        expect(wrapper.find('.qa-AoiInfobar-icon-polygon')).toHaveLength(4);
    });

    it('clicking on zoom button should call clickZoomToSelection', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: '0 sq km fake title',
        };
        setup({ aoiInfo });
        wrapper.find('.qa-AoiInfobar-button-zoom').simulate('click');
        expect(props.clickZoomToSelection.calledOnce).toEqual(true);
    });

    it('clicking on revert button should call onRevertClick', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: '0 sq km fake title',
        };
        setup({ aoiInfo, showRevert: true });
        wrapper.find('.qa-AoiInfobar-button-revert').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('getIcon should return ImageCropSquare', () => {
        const icon = getIcon('Polygon', 'Box');
        expect(icon.type).toBe(ImageCropSquare);
    });

    it('getIcon should return Extent', () => {
        const icon = getIcon('Polygon', 'Map View');
        expect(icon.type).toBe(Extent);
    });

    it('getIcon should return ActionRoom', () => {
        const icon = getIcon('Point', '');
        expect(icon.type).toBe(ActionRoom);
    });

    it('getIcon should return Line', () => {
        const icon = getIcon('Line', '');
        expect(icon.type).toBe(Line);
    });

    it('getIcon should return IrregularPolygon', () => {
        const icon = getIcon('Polygon', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return IrregularPolygon', () => {
        const icon = getIcon('Collection', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return AlertWarning', () => {
        const icon = getIcon('', '');
        expect(icon.type).toEqual(AlertWarning);
    });
});
