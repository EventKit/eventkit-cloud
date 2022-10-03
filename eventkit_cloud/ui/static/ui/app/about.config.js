import create from '../images/AboutPage/three_step_1.png';
import manage from '../images/AboutPage/three_step_2.png';
import use from '../images/AboutPage/three_step_3.png';

export const about = [
    {
        type: 'InfoParagraph',
        title: 'Overview',
        body:
        `EventKit's mission is to save its users' time and frustration by simplifying
            the process for getting deployment-ready geospatial information.
            EventKit works by configuring geospatial data web services in the application,
            and then exporting that data into a portable data format based on a custom,
            user-provided extent. The results are downloadable and ready-to-use datasets called DataPacks.
            For EventKit v1.1, the maximum allowable size for an Area of Interest (AOI) is set to the approximate size of a large city,
            with scalability improvements coming soon.
            Reach out to us if you need to process a larger area.`,
    },
    {
        type: 'InfoParagraph',
        title: 'What is a DataPack?',
        body:
        `DataPacks are zipped archives (.zip) of geospatial data, cartography, and metadata.
            Each dataset is already processed. Raster data is tiled for quick rendering, and feature data, such as OSM,
            has been converted into various schemas designed to make viewing and visual analysis easier.
            The provided QGIS project file includes styling with icons and neatly groups raster data.
            Limited support for ArcGIS is also available.`,
    },
    {
        type: 'ThreeStepInfo',
        title: 'DataPacks',
        steps: [
            { img: manage, caption: 'Manage DataPacks' },
            { img: create, caption: 'Create DataPacks' },
            { img: use, caption: 'Use with other open source geospatial software like QGIS' },
        ],
    },
    {
        type: 'InfoGrid',
        title: 'Data Products & Formats',
        items: [
            {
                title: 'OSM Data',
                body: `OpenStreetMap vector data provided in a custom thematic schema.
                  Data is grouped into separate tables (e.g. water, roads...) and is styled for use in QGIS or ArcGIS.
                  Exported as a zip file.`,
            },
        ],
    },
    {
        type: 'InfoParagraph',
        title: 'Working in QGIS & ArcGIS',
        body: (
            <div>
                <p>
                    DataPacks include both a qgs file for use in QGIS and a script for generating an mxd for use in ArcGIS.
                    If you have QGIS installed, simply extract the zip file and open the qgs file.
                </p>
                <p>
                    Support for ArcGIS is limited in EventKit v1.1 with improvements coming soon.
                    After downloading your DataPack and unzipping it, you’ll see a python script called “create_mxd”.
                    Provided you have ArcGIS installed, you can double click this script to generate an mxd for use in ArcGIS.
                    This works best in ArcGIS 10.5.1 and above, with partial support down to 10.4
                </p>
            </div>
        ),
    },
    {
        type: 'InfoGrid',
        title: 'What\'s New',
        items: [
            {
                title: 'Product Tour',
                body: 'Simply hit the question mark icon on any page for a walkthrough.',
            },
            {
                title: 'ArcGIS Support',
                body: 'A script you’ll run locally to generate an mxd for use in ArcGIS.',
            },
            {
                title: 'Dashboard',
                body: 'Provides an improved view into your content along with system notifications.',
            },
            {
                title: 'Sharing',
                body: 'Allows you to share DataPacks with individuals or groups (e.g., you create a group for your team).',
            },
            {
                title: 'Data Availability Check',
                body: `EventKit is at the mercy of its external data products.
                    This check pings the external service to let you know if it is available.`,
            },
            {
                title: 'Improved Buffer',
                body: 'Improved interface for applying a buffer to your Area of Interest.',
            },
        ],
    },
    {
        type: 'InfoParagraph',
        title: 'Roadmap',
        body: (
            <div>
                <p>
                    The EventKit roadmap outlines the development of new features,
                    and our next few releases include improvements across a range of topics.
                    In general these include more datasets, formats, and projections,
                    the ability to preview data products, ways to pre-build,
                    recommend, and discover new datasets, ability to process larger areas, and continued integrations into QGIS and ESRI.
                </p>
                <p>
                    If you have specific features or workflows that you&apos;d like to see in EventKit,
                    please let us know.
                </p>
            </div>
        ),
    },
    {
        type: 'InfoParagraph',
        title: 'Additional Resources',
        body: (
            <div style={{ textAlign: 'center' }}>
                <a href="https://github.com/eventkit/eventkit-cloud">GitHub</a>
                <br />
            </div>
        ),
    },
];

export default about;
