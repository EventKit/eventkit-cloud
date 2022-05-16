import * as sinon from 'sinon';
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import {ProviderRowRegionWrap} from "../../components/StatusDownloadPage/ProviderRowRegionWrap";
import RegionJustification from "../../components/StatusDownloadPage/RegionJustification";
import ProviderRow from '../../components/StatusDownloadPage/ProviderRow';


jest.mock('../../components/StatusDownloadPage/ProviderRow', () => jest.fn());
jest.mock('../../components/StatusDownloadPage/RegionJustification', () => jest.fn());

describe('ProviderRow component', () => {

    const getProps = () => ({
        providerTask: {provider: null} as Eventkit.ProviderTask,
        selectedProviders: null,
        providers: null,
        job: null,
        backgroundColor: 'white',
        onSelectionToggle: sinon.spy(),
        onProviderCancel: sinon.spy(),
        selectProvider: sinon.spy(),
        extents: [{}],
    });

    const providerRowRef = {} as any;
    const regionJustificationRef = {} as any;

    const setup = (propsOverride = {}) => {
        (RegionJustification as any).mockImplementation((props) => {
            regionJustificationRef.props = props;
            // Simulate the dialog being displayed only when "open"
            return ((props.display) ? (<div className="regionJustification">regionJustification</div>) : 'null');
        });
        (ProviderRow as any).mockImplementation((props) => {
            providerRowRef.props = props;
            return (<div className="providerRow">providerRow</div>);
        });
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<ProviderRowRegionWrap {...props} />);
    };

    it('should render provider row and region justification when opened', () => {
        setup();
        expect(screen.queryByText('providerRow')).toBeInTheDocument();
        expect(screen.queryByText('regionJustification')).not.toBeInTheDocument();
        providerRowRef.props.openDialog();
        expect(screen.queryByText('regionJustification')).toBeInTheDocument();
    });
});
