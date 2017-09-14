import create_img from '../images/AboutPage/three_step_1.png';
import manage_img from '../images/AboutPage/three_step_2.png';
import use_img from '../images/AboutPage/three_step_3.png';
import manage_1 from '../images/AboutPage/manage_1.png';
import manage_2 from '../images/AboutPage/manage_2.png';
import manage_3 from '../images/AboutPage/manage_3.png';
import create_1_1 from '../images/AboutPage/create_step_one_1.png';
import create_1_2 from '../images/AboutPage/create_step_one_2.png';
import create_1_3 from '../images/AboutPage/create_step_one_3.png';
import create_2_1 from '../images/AboutPage/create_step_two_1.png';
import create_2_2 from '../images/AboutPage/create_step_two_2.png';
import create_2_3 from '../images/AboutPage/create_step_two_3.png';
import create_3_1 from '../images/AboutPage/create_step_three_1.png';
import create_3_2 from '../images/AboutPage/create_step_three_2.png';
import download_1 from '../images/AboutPage/download_1.png';
import download_2 from '../images/AboutPage/download_2.png';

export const Config = {
    REGIONS_URL : '/api/regions.json',
    REGION_MASK_URL : '/api/maskregions.json',
    JOBS_URL : '/api/jobs',
    RUNS_URL : '/api/runs',
    RERUN_URL : '/api/rerun?job_uid=',
    EXPORT_FORMATS_URL : '/api/formats.json',
    PROVIDERS_URL : '/api/providers.json',
    CONFIGURATION_URL : '/api/configurations',
    HDM_TAGS_URL : '/api/hdm-data-model?format=json',
    OSM_TAGS_URL : '/api/osm-data-model?format=json',
    NOMINATIM_SEARCH_URL : 'http://nominatim.openstreetmap.org/search',
    MAPQUEST_SEARCH_URL : 'http://open.mapquestapi.com/nominatim/v1/search',
    CREATE_ERROR_URL : '/error',
    UPDATE_BROWSER_URL : '/update',
    AUTH_URL : '/login',
    ABOUT_PAGE: {
        textParagraphs: [
            {header: 'Overview', body: 'EventKit\'s mission is to save user\'s time and frustration by simplifying the process for getting deployment-ready geospatial information. EventKit works by configuring geospatial data web services in the application, and then exporting that data into a portable data format based on a custom, user-provided extent.  The results are downloadable and ready-to-use datasets called datapacks.'},
            {header: 'What is a DataPack?', body: 'Datapacks are zipped archives of geospatial data, cartography, and metadata. Each dataset is already processed.  Raster data is tiled for quick rendering and feature data, such as OSM, has been converted into various schemas designed to make viewing and visual analysis easier. The provided QGIS project file includes styling with icons and neatly groups raster data.'},
        ],
        threeStep: [
            {img: create_img, caption: 'Create DataPacks'},
            {img: manage_img, caption: 'Manage DataPacks'},
            {img: use_img, caption: 'Use with other open source geospatial software like QGIS'}
        ],
        quickTour: [
            {
                header: 'MANAGE DATAPACKS',
                tourSections: [
                    {
                        sectionTitle: 'DataPack Library',
                        steps: [
                            {img: manage_1, caption: 'Here you can create or search, sort, and filter all private and public DataPacks.'}, 
                            {img: manage_2, caption: 'Check the status of previously created DataPacks.'},
                            {img: manage_3, caption: 'Make other actions like "Go to Export Detail" to check export statuses and make downloads.'}
                        ]
                    }
                ]
            },
            {
                header: 'CREATE DATAPACKS',
                tourSections: [
                    {
                        sectionTitle: 'Step 1: Define Area of Interest',
                        steps: [
                            {img: create_1_1, caption: 'Use your tools to set your Area of Interest.'}, 
                            {img: create_1_2, caption: 'You can cancel or clear your selection using the "X"'},
                            {img: create_1_3, caption: 'Once your area of interest is set, move to the next step with the green right arrow button.'}
                        ]
                    },
                    {
                        sectionTitle: 'Step 2: Enter General Information',
                        steps: [
                            {img: create_2_1, caption: 'Enter general details and identifying information.'}, 
                            {img: create_2_2, caption: 'Choose your layers.'},
                            {img: create_2_3, caption: 'Use the right green arrow to review your DataPack.'}
                        ]
                    },
                    {
                        sectionTitle: 'Step 3: Review & Submit',
                        steps: [
                            {img: create_3_1, caption: 'Review your information to make sure it\'s correct.'}, 
                            {img: create_3_2, caption: 'Click the green check mark to submit your DataPack or use the back arrow to edit previous pages.'},
                        ]
                    },
                    {
                        sectionTitle: 'Get Your Files: Export Status & Download',
                        steps: [
                            {img: download_1, caption: 'You\'ll get an e-mail when your files are ready. Use the table to download.'}, 
                            {img: download_2, caption: 'You can alse edit your DataPack expiration date an viewing permisions.'},
                        ]
                    }
                ]
            },
        ]
    }
};
