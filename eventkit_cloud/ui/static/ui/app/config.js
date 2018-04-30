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

export const JoyRideStyles = {
    tooltipStyle: {
        backgroundColor: 'white',
        borderRadius: '0',
        color: 'black',
        mainColor: '#ff4456',
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: '#4598bf',
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },
        button: {
            color: 'white',
            backgroundColor: '#4598bf',
        },
        skip: {
            display: 'none',
        },
        back: {
            color: '#8b9396',
        },
        hole: {
            backgroundColor: 'rgba(226,226,226, 0.2)',
        },
    },

    welcomeTooltipStyle: {
        backgroundColor: 'white',
        borderRadius: '0',
        color: 'black',
        mainColor: '#ff4456',
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: '#4598bf',
        },
        arrow: {
            display: 'none',
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },

        button: {
            color: 'white',
            backgroundColor: '#4598bf',
        },
        skip: {
            display: 'none',
        },
        back: {
            color: '#8b9396',
        },
        hole: {
            display: 'none',
        },
    }
}


export const Config = {
    BANNER_TEXT: '',
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
            {header: 'Overview', body: 'EventKit\'s mission is to save its users\' time and frustration by simplifying the process for getting deployment-ready geospatial information. EventKit works by configuring geospatial data web services in the application, and then exporting that data into a portable data format based on a custom, user-provided extent. The results are downloadable and ready-to-use datasets called DataPacks.'},
            {header: 'What is a DataPack?', body: 'DataPacks are zipped archives of geospatial data, cartography, and metadata. Each dataset is already processed. Raster data is tiled for quick rendering, and feature data, such as OSM, has been converted into various schemas designed to make viewing and visual analysis easier. The provided QGIS project file includes styling with icons and neatly groups raster data.'},
        ],
        threeStep: [
            {img: manage_img, caption: 'Manage DataPacks'},
            {img: create_img, caption: 'Create DataPacks'},
            {img: use_img, caption: 'Use with other open source geospatial software like QGIS'}
        ],
        quickTour: [
            {
                header: 'MANAGE DATAPACKS',
                tourSections: [
                    {
                        sectionTitle: 'DataPack Library',
                        steps: [
                            {img: manage_1, caption: 'Here you can create a new DataPack or search, sort, and filter all private and public DataPacks.'},
                            {img: manage_2, caption: 'Check the status of previously created DataPacks.'},
                            {img: manage_3, caption: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.'}
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
                            {img: create_1_1, caption: 'Use the tools to set your Area of Interest.'},
                            {img: create_1_2, caption: 'You can cancel or clear your selection using the "X".'},
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
                            {img: create_3_2, caption: 'Click the green check mark to submit your DataPack, or use the back arrow to edit previous pages.'},
                        ]
                    },
                    {
                        sectionTitle: 'Get Your Files: Export Status & Download',
                        steps: [
                            {img: download_1, caption: 'You\'ll get an e-mail when your files are ready. Download your data in the "Download Options" section.'},
                            {img: download_2, caption: 'You can also edit your DataPack expiration date and viewing permissions.'},
                        ]
                    }
                ]
            },
        ]
    },
    JOYRIDE: {
        exportInfo:
            [
                {
                    title: 'Enter General Information',
                    text: 'Enter the general details and identifying information about the DataPack.',
                    selector: '.qa-ExportInfo-input-name',
                    position: 'bottom',
                    style:  JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Choose your sources',
                        text: 'Choose the data sources desired for the DataPack.',
                    selector: '.qa-ExportInfo-List',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Check the source availability',
                        text: 'This indicates the data source availability.  If the source is available, a green check mark will be displayed.  If the source is unavailable for any reason, an error icon will be shown here to indicate that something has gone wrong.',
                    selector: '.qa-ProviderStatusIcon',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Projection',
                        text: 'At this time, EventKit shows one projection, World Geodetic System 1984 (WGS 84) projection.  This projection is also commonly known by its EPSG code: 4326. Additional projection support will be added in subsequent versions of EventKit.',
                    selector: '#projectionCheckbox',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'File Formats',
                        text: 'At this time, EventKit has the ability to export one file format.  EventKit provides all geospatial data in the GeoPackage (.gpkg) format. Additional format support will be added in subsequent versions.',
                    selector: '#formatsCheckbox',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Review Selected AOI',
                        text: 'Expand the map to review the AOI that was selected on the previous screen.',
                    selector: '.qa-ExportInfo-CardHeader-map',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Go to next step',
                        text: 'Once the information is entered, move to the next step in the create process by clicking the green arrow button.',
                    selector: '.qa-BreadcrumbStepper-FloatingActionButton-case1',
                    position: 'left',
                    style: JoyRideStyles.tooltipStyle,
                },
            ],
        Account: [
            {
                title: 'Welcome to the Account Settings Page',
                text: 'This page contains Licenses and Terms of Use along with some personal information.  On your initial login, you must agree to these Licenses and Terms of Use to use EventKit.  You will only be required to re-visit this page in the future if new Licenses and Terms of Use are introduced with a new data provider.',
                selector: '.qa-Account-AppBar',
                position: 'top',
                style: JoyRideStyles.welcomeTooltipStyle,
                isFixed: true,
            },
            {
                title: 'License Agreement Info',
                text: 'You can expand the license text and scroll down to review.  You can download the license text if you so choose.',
                selector: '.qa-UserLicense-ArrowDown',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Agree to Licenses',
                text: 'Once you’ve reviewed the licenses, you can agree to them individually.',
                selector: '.qa-UserLicense-Checkbox',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Agree to Licenses',
                text: 'Or you can choose to agree to them collectively.',
                selector: '.qa-LicenseInfo-Checkbox',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Save Agreements',
                text: 'Once you have selected the licenses to agree to, click Save Changes.',
                selector: '.qa-SaveButton-RaisedButton-SaveChanges',
                position: 'top',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Navigate Application',
                text: 'Once you have saved the license agreements, you can navigate away from the page to browse DataPacks.',
                selector: '.qa-Application-MenuItem-exports',
                position: 'top',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Navigate Application',
                text: 'Or to create your own DataPack.',
                selector: '.qa-Application-MenuItem-create',
                position: 'top',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
        ],
        ExportAOI: [
            {
                title: 'Welcome to the Create Datapack page.',
                text: 'Creating DataPacks is the core function of EventKit. The process begins with defining an Area of Interest (AOI), then selecting Data Sources and output formats.',
                selector: '.qa-BreadcrumbStepper-div-content',
                position: 'bottom',
                style: JoyRideStyles.welcomeTooltipStyle,
            },
            {
                title: 'Search for location',
                text: 'EventKit has several gazetteers that are searchable from the location search box, just start typing a location name and options appear. MGRS coordinates can also be used. Once a location is selected, the map automatically navigates to that location.',
                selector: '.bootstrap-typeahead-input',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Define',
                text: 'Use tools to draw box or freehand boundaries.  <br> Set the viewport by clicking current view.  <br>You can also upload a GeoJSON, KML, GeoPackage, or zipped shapefile using the file import option.',
                selector: '.qa-DrawAOIToolbar-div',
                position: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Cancel Selection',
                text: 'Cancel or clear selection by clicking the "X".',
                selector: '.qa-DrawBoxButton-button',
                position: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Go to next step',
                text: 'Once the area of interest is set, move to the next step in the create process by clicking the green arrow button.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-case0',
                position: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
        ],
        ExportSummary: [
            {
                title: 'Verify Information',
                text: 'Verify the information entered is correct before proceeding.',
                selector: '.qa-ExportSummary-div',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            }, {
                title: 'Go Back to Edit',
                text: 'If you need to make changes before submitting, use the small blue arrow to navigate back.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-previous',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Submit DataPack',
                text: 'Once ready, click the large green button to kick off the DataPack submission process.  You will be redirected to the Status and Download page.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-case2',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
        ],
        StatusAndDownload: [
            {
                title: 'Welcome to the Status & Download Page',
                text: 'You can review relevant information about the DataPack here such as its creation date, Area of Interest, and which data is included.  Most importantly, you can download the data.',
                selector: '.qa-StatusDownload-AppBar',
                position: 'top',
                style: JoyRideStyles.welcomeTooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Info',
                text: 'This is the name that was entered for the name of the DataPack upon creation.',
                selector: '.qa-DataCartDetails-div-name',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Status',
                text: 'This is the status of the DataPack.  Status reports include: submitted, completed, and failed.  Here you can change the expiration date of the DataPack and also set the permission: Private or Shared.',
                selector: '.qa-DataCartDetails-div-StatusContainer',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Download Options',
                text: 'Here you will find download options for the DataPack. <br> Each data source has its own table where you can view status of the current downloadable files.',
                selector: '.qa-DataCartDetails-div-downloadOptionsContainer',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Other Options',
                text: 'Here you can run the DataPack again which will refresh the data.  You can clone, which will create a new DataPack using the existing specifications.  From there you can make tweaks to the AOI, the selected data sources, and the metadata (e.g., the name of the DataPack, the permissions).  And you can delete the DataPack.',
                selector: '.qa-DataCartDetails-div-otherOptionsContainer',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'General Information',
                text: 'Here you will find general information related to the DataPack.  ',
                selector: '.qa-DataCartDetails-div-generalInfoContainer',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'AOI',
                text: 'This is the selected area of interest for the DataPack.',
                selector: '.qa-DataCartDetails-div-map',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Export Information',
                text: 'This contains information specific to the export.',
                selector: '.qa-DataCartDetails-div-exportInfoContainer',
                position: 'top',
                style: JoyRideStyles.tooltipStyle,
                isFixed: true,
            },
        ],
        DataPackPage: {
            list: [
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: JoyRideStyles.welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status (complete, running, error) of previously created DataPacks.',
                    selector: '.qa-DataPackTableItem-TableRowColumn-status',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Menu Options',
                    text: 'Use this menu to navigate to the “Status & Download” page where you can download the DataPack files, share the DataPack with other EventKit users, or delete the datapack.',
                    selector: '.qa-DataPackTableItem-IconMenu',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
            ],
            grid: [
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: JoyRideStyles.welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,

                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status (complete, running, error) of previously created DataPacks.',
                    selector: '.qa-DataPackGridItem-CardActions',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Menu Options',
                    text: 'Use this menu to navigate to the “Status & Download” page where you can download the DataPack files, share the DataPack with other EventKit users, or delete the datapack.',
                    selector: '.qa-DataPackGridItem-IconMenu',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
            ],
            map:[
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: JoyRideStyles.welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,

                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status (complete, running, error) of previously created DataPacks.',
                    selector: '.qa-DataPackListItem-subtitle-date',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Menu Options',
                    text: 'Use this menu to navigate to the “Status & Download” page where you can download the DataPack files, share the DataPack with other EventKit users, or delete the datapack.',
                    selector: '.qa-DataPackListItem-IconMenu',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: JoyRideStyles.tooltipStyle,
                },
            ],
        }
        },

    };


