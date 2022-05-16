import * as sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import { BufferDialog } from '../../components/CreateDataPack/BufferDialog';
import {JobValidationProvider} from "../../components/CreateDataPack/context/JobValidation";
import {ProviderLimits} from "../../components/CreateDataPack/EstimateContainer";

describe('AlertCallout component', () => {
    const getProps = () => ({
        show: true,
        value: 0,
        valid: true,
        handleBufferClick: sinon.spy(),
        handleBufferChange: sinon.spy(),
        closeBufferDialog: sinon.spy(),
        aoi: {},
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    const setup = (overrides = {}, area=100) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(
            <JobValidationProvider value={{
                providerLimits: [{maxDataSize: 100, maxArea: 100, slug: 'osm'} as ProviderLimits],
                aoiHasArea: true,
                aoiArea: area,
                aoiBboxArea: area,
                dataSizeInfo: {} as any,
                isCollectingEstimates: false,
            }}>
                <BufferDialog {...props} />
            </JobValidationProvider>);
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
        expect(wrapper.find('.qa-BufferDialog-background')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-main')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-header')).toHaveLength(1);
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find(Clear)).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-body')).toHaveLength(1);
        expect(wrapper.find(Slider)).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-footnote')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-footer')).toHaveLength(1);
        expect(wrapper.find(TextField).props().style.color).toEqual('#808080');
    });

    it('should not render anything if show is false', () => {
        setup({show: false});
        expect(wrapper.find('.qa-BufferDialog-main').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.qa-BufferDialog-background').hostNodes()).toHaveLength(0);
    });

    it('should render a warning if the area exceeds the aoi limit', () => {
        setup({}, 1000);
        expect(wrapper.find('.qa-BufferDialog-warning')).toHaveLength(1);
    });

    it('Clear icon should call closeBufferDialog on click', () => {
        wrapper.find(Clear).simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });
});
