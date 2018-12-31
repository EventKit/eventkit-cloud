import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';
import CloudDownload from '@material-ui/icons/CloudDownload';
import { DataPackDetails } from '../../components/StatusDownloadPage/DataPackDetails';
import ProviderRow from '../../components/StatusDownloadPage/ProviderRow';

describe('DataPackDetails component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const providerTasks = [
        {
            name: 'OpenStreetMap Data (Themes)',
            status: 'COMPLETED',
            tasks: [
                {
                    duration: '0:00:15.317672',
                    errors: [],
                    estimated_finish: '',
                    finished_at: '2017-05-15T15:29:04.356182Z',
                    name: 'OverpassQuery',
                    progress: 100,
                    started_at: '2017-05-15T15:28:49.038510Z',
                    status: 'SUCCESS',
                    uid: 'fcfcd526-8949-4c26-a669-a2cf6bae1e34',
                    result: {
                        size: '1.234 MB',
                        url: 'http://cloud.eventkit.test/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34',
                    },
                    display: true,
                },
            ],
            uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
            url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
            display: true,
            slug: 'osm',
        }];

    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: {
                slug: 'osm',
                name: 'Open Database License (ODbL) v1.0',
                text: 'ODC Open Database License (ODbL).',
            },
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'OpenStreetMap vector data.',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];

    const getProps = () => ({
        providerTasks,
        providers,
        zipFileProp: null,
        onProviderCancel: sinon.spy(),
        classes: { root: {} },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackDetails {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render elements', () => {
        expect(wrapper.find('div').at(1).text()).toEqual('Download Options');
        expect(wrapper.find(Table)).toHaveLength(1);
        const table = wrapper.find(Table).dive();
        expect(table.find(TableRow)).toHaveLength(1);
        expect(table.find(TableCell)).toHaveLength(4);
        expect(wrapper.find(Table).find(TableCell)
            .at(0)
            .find(Button)
            .html())
            .toContain('CREATING DATAPACK ZIP');
        expect(table.find(TableCell).at(1).dive().html()).toContain('FILE SIZE');
        expect(table.find(TableCell).at(2).dive().html()).toContain('PROGRESS');
        expect(wrapper.find(ProviderRow)).toHaveLength(1);
    });

    it('getTextFontSize should return the font string for table text based on window width', () => {
        wrapper.setProps({ width: 'xs' });
        expect(instance.getTextFontSize()).toEqual('10px');

        wrapper.setProps({ width: 'sm' });
        expect(instance.getTextFontSize()).toEqual('11px');

        wrapper.setProps({ width: 'md' });
        expect(instance.getTextFontSize()).toEqual('12px');

        wrapper.setProps({ width: 'lg' });
        expect(instance.getTextFontSize()).toEqual('13px');

        wrapper.setProps({ width: 'xl' });
        expect(instance.getTextFontSize()).toEqual('14px');
    });

    it('getTableCellWidth should return the pixel string for table width based on window width', () => {
        wrapper.setProps({ width: 'sm' });
        expect(instance.getTableCellWidth()).toEqual('80px');

        wrapper.setProps({ width: 'md' });
        expect(instance.getTableCellWidth()).toEqual('120px');
    });

    it('isZipFileCompleted should return true or false', () => {
        props.zipFileProp = null;
        instance.isZipFileCompleted();
        expect(instance.isZipFileCompleted()).toEqual(false);
        const nextProps = { ...props };
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        instance.isZipFileCompleted();
        expect(instance.isZipFileCompleted()).toEqual(true);
    });

    it('getCloudDownloadIcon should be called with correct data', () => {
        props.zipFileProp = null;
        instance.getCloudDownloadIcon();
        expect(instance.getCloudDownloadIcon()).toEqual((
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-disabled"
                style={{ fill: '#808080', marginRight: '5px', verticalAlign: 'middle' }}
            />
        ));
        const nextProps = { ...props };
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        instance.getCloudDownloadIcon();
        expect(instance.getCloudDownloadIcon()).toEqual((
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{ fill: '#4598bf', marginRight: '5px', verticalAlign: 'middle' }}
            />
        ));
    });

    it('handleInfoOpen should set infoOpen true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleInfoOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ infoOpen: true })).toBe(true);
    });

    it('handleInfoClose should set infoOpen false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleInfoClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ infoOpen: false })).toBe(true);
    });
});
