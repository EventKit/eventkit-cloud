import React from 'react';
import { mount } from 'enzyme';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';
import CloudDownload from '@material-ui/icons/CloudDownload';
import { DataPackDetails } from '../../components/StatusDownloadPage/DataPackDetails';
import ProviderRow from '../../components/StatusDownloadPage/ProviderRow';

describe('DataPackDetails component', () => {
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
        onProviderCancel: () => {},
        classes: { root: {} },
    });

    const getWrapper = props => mount(<DataPackDetails {...props} />);

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('div').at(1).text()).toEqual('Download Options');
        expect(wrapper.find(Table)).toHaveLength(2);
        const table = wrapper.find(Table).first();
        expect(table.find(TableRow)).toHaveLength(1);
        expect(table.find(TableCell)).toHaveLength(4);
        expect(table.find(TableCell).at(0).text()).toEqual('CREATING DATAPACK ZIP');
        expect(table.find(TableCell).at(0).find(Button)).toHaveLength(1);
        expect(table.find(TableCell).at(1).text()).toEqual('FILE SIZE');
        expect(table.find(TableCell).at(2).text()).toEqual('PROGRESS');
        expect(wrapper.find(ProviderRow)).toHaveLength(1);
    });
    it('getTextFontSize should return the font string for table text based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getTextFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTextFontSize()).toEqual('11px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTextFontSize()).toEqual('12px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTextFontSize()).toEqual('13px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTextFontSize()).toEqual('14px');
    });

    it('getTableCellWidth should return the pixel string for table width based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTableCellWidth()).toEqual('80px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');
    });

    it('isZipFileCompleted should return true or false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.zipFileProp = null;
        wrapper.instance().isZipFileCompleted();
        expect(wrapper.instance().isZipFileCompleted()).toEqual(false);
        const nextProps = { ...props };
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        wrapper.instance().isZipFileCompleted();
        expect(wrapper.instance().isZipFileCompleted()).toEqual(true);
    });

    it('getCloudDownloadIcon should be called with correct data', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.zipFileProp = null;
        wrapper.instance().getCloudDownloadIcon();
        expect(wrapper.instance().getCloudDownloadIcon()).toEqual((
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-disabled"
                style={{ fill: 'grey', marginRight: '5px', verticalAlign: 'middle' }}
            />
        ));
        const nextProps = { ...props };
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        wrapper.instance().getCloudDownloadIcon();
        expect(wrapper.instance().getCloudDownloadIcon()).toEqual((
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{ fill: '#4598bf', marginRight: '5px', verticalAlign: 'middle' }}
            />
        ));
    });
});
