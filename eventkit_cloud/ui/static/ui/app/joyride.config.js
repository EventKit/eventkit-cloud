import { colors } from './styles/eventkit_theme';

export const JoyRideStyles = {
    tooltipStyle: {
        back: {
            color: colors.text_primary,
        },
        backgroundColor: colors.white,
        borderRadius: '0',
        button: {
            backgroundColor: colors.primary,
            color: colors.white,
        },
        color: colors.black,
        header: {
            borderColor: colors.primary,
            fontSize: '20px',
            textAlign: 'left',
        },
        hole: {
            backgroundColor: 'rgba(226,226,226, 0.2)',
        },
        main: {
            paddingBottom: '20px',
            paddingTop: '20px',
        },
        skip: {
            display: 'none',
        },
        textAlign: 'left',
    },
    welcomeTooltipStyle: {
        arrow: {
            display: 'none',
        },
        back: {
            color: colors.text_primary,
        },
        backgroundColor: colors.white,
        borderRadius: '0',
        button: {
            backgroundColor: colors.primary,
            color: colors.white,
        },
        color: colors.black,
        header: {
            borderColor: colors.primary,
            fontSize: '20px',
            textAlign: 'left',
        },
        hole: {
            display: 'none',
        },
        main: {
            paddingBottom: '20px',
            paddingTop: '20px',
        },
        skip: {
            display: 'none',
        },
        textAlign: 'left',
    },
};

export const joyride = {
    Account: [
        {
            position: 'top',
            selector: '.qa-PageHeader',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `This page contains Licenses and Terms of Use along with some personal information.
                On your initial login, you must agree to these Licenses and Terms of Use to use EventKit.
                You will only be required to re-visit this page in the future if new Licenses and
                Terms of Use are introduced with a new data provider.`,
            title: 'Welcome to the Account Settings Page',
        },
        {
            position: 'bottom',
            selector: '.qa-UserLicense-expand',
            style: JoyRideStyles.tooltipStyle,
            text: 'You can expand the license text and scroll down to review.  You can download the license text if you so choose.',
            title: 'License Agreement Info',

        },
        {
            position: 'bottom',
            selector: '.qa-UserLicense-Checkbox',
            style: JoyRideStyles.tooltipStyle,
            text: 'Once you’ve reviewed the licenses, you must agree to them. You can agree to each license individually.',
            title: 'Agree to Licenses',

        },
        {
            position: 'bottom',
            selector: '.qa-LicenseInfo-Checkbox',
            style: JoyRideStyles.tooltipStyle,
            text: 'Or you can agree to them collectively.',
            title: 'Agree to Licenses',
        },
        {
            position: 'top',
            selector: '.qa-SaveButton-Button-SaveChanges',
            style: JoyRideStyles.tooltipStyle,
            text: 'Once you have agreed to the licenses, click Save Changes.',
            title: 'Save Agreements',
        },
        {
            position: 'top',
            selector: '.qa-Drawer-MenuItem-exports',
            style: JoyRideStyles.tooltipStyle,
            text: 'Once you have saved the license agreements, you can navigate away from the page to browse DataPacks.',
            title: 'Navigate Application',
        },
        {
            position: 'top',
            selector: '.qa-Drawer-MenuItem-create',
            style: JoyRideStyles.tooltipStyle,
            text: 'Or to create your own DataPack.',
            title: 'Navigate Application',
        },
    ],
    DashboardPage: [
        {
            position: 'top',
            scrollToId: 'Dashboard',
            selector: '.qa-PageHeader',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `The Dashboard provides a curated view into EventKit content.
                Here, you’ll get notifications on relevant EventKit activity, get a personalized view into your content,
                and have easy access to the Featured DataPacks.
                You’ll land on this page each time you login to EventKit.`,
            title: 'Welcome to the Dashboard Page',
        },
        {
            position: 'top',
            scrollToId: 'DashboardSectionNotifications',
            selector: '.qa-DashboardSection-Notifications',
            style: JoyRideStyles.tooltipStyle,
            text: `You’ll receive notifications here updating you on your DataPack’s progress,
                along with information on how and when DataPacks are shared.
                To view all of your notifcations and manage them, click view all,
                or select the notification bell icon in the upper left of the screen.`,
            title: 'Notifications',
        },
        {
            position: 'bottom',
            scrollToId: 'DashboardSectionRecently Viewed',
            selector: '.qa-DashboardSection-Recently.Viewed',
            style: JoyRideStyles.tooltipStyle,
            text: `As the name implies, this section shows you which DataPacks you have recently viewed.
                The DataPacks are organized chronologically – meaning the first DataPack you see on the left
                will be the most recent one you viewed`,
            title: 'Recently Viewed',
        },
        {
            position: 'bottom',
            scrollToId: 'DashboardSectionFeatured',
            selector: '.qa-DashboardSection-Featured',
            style: JoyRideStyles.tooltipStyle,
            text: `EventKit has a concept of Featured DataPacks, where administrators will highlight certain DataPacks that
                may be relevant to a large section of the community e.g., a recent hurricane. 
                If you want to suggest promoting one of your DataPacks, reach out to the EventKit team from the About page.`,
            title: 'Featured',
        },
        {
            position: 'top',
            scrollToId: 'DashboardSectionMy DataPacks',
            selector: '.qa-DashboardSection-My.DataPacks',
            style: JoyRideStyles.tooltipStyle,
            text: `Finally, you can view the DataPacks that you’ve created.
                Keep in mind that by default DataPacks expire after two weeks,
                though you can reset the expiration as often as you need to by clicking on the DataPack and hitting the Expires field.`,
            title: 'My DataPacks',
        },
    ],
    DataPackPage: {
        grid: [
            {
                position: 'top',
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                title: 'Welcome to the DataPack Library.',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackPage-view',
                style: JoyRideStyles.tooltipStyle,
                text: `By default, EventKit will show the most recent subset of DataPacks in the grid view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                title: 'DataPacks',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackSearchBar-TextField',
                style: JoyRideStyles.tooltipStyle,
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                title: 'Text Search',
            },
            {
                position: 'bottom',
                selector: '.qa-FilterDrawer-Drawer > div',
                style: JoyRideStyles.tooltipStyle,
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                title: 'Filters',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackGridItem-CardActions',
                style: JoyRideStyles.tooltipStyle,
                text: 'Check the status (complete, running, error) of previously created DataPacks.',
                title: 'DataPack Status',
            },
            {
                position: 'bottom',
                selector: '.tour-datapack-options',
                style: JoyRideStyles.tooltipStyle,
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                title: 'Menu Options',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackViewButtons-Icons',
                style: JoyRideStyles.tooltipStyle,
                text: `Change the view of the DataPack Library,
                    options include the default map view, a “baseball card” view, and traditional table view.`,
                title: 'Change Views',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: JoyRideStyles.tooltipStyle,
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                title: 'Create DataPack',
            },
        ],
        list: [
            {
                position: 'top',
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                title: 'Welcome to the DataPack Library.',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackList-root',
                style: JoyRideStyles.tooltipStyle,
                text: `By default, EventKit will show the most recent subset of DataPacks in the list view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                title: 'DataPacks',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackSearchBar-TextField',
                style: JoyRideStyles.tooltipStyle,
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                title: 'Text Search',
            },
            {
                position: 'bottom',
                selector: '.qa-FilterDrawer-Drawer > div',
                style: JoyRideStyles.tooltipStyle,
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                title: 'Filters',
            },
            {
                position: 'bottom',
                selector: '.tour-datapack-status',
                style: JoyRideStyles.tooltipStyle,
                text: 'Check the status (complete, running, error) of previously created DataPacks.',
                title: 'DataPack Status',
            },
            {
                position: 'bottom',
                selector: '.tour-datapack-options',
                style: JoyRideStyles.tooltipStyle,
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                title: 'Menu Options',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackViewButtons-Icons',
                style: JoyRideStyles.tooltipStyle,
                text: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                title: 'Change Views',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: JoyRideStyles.tooltipStyle,
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                title: 'Create DataPack',
            },
        ],
        map: [
            {
                position: 'top',
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                title: 'Welcome to the DataPack Library',
            },
            {
                position: 'right',
                selector: '.qa-MapView-GridList',
                style: JoyRideStyles.tooltipStyle,
                text: `By default, EventKit will show the most recent subset of DataPacks in the map view.
                    Clicking on a DataPack in the list will highlight its location on the map, and vice versa.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                title: 'DataPacks',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackSearchBar-TextField',
                style: JoyRideStyles.tooltipStyle,
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                title: 'Text Search',
            },
            {
                position: 'bottom',
                selector: '.qa-FilterDrawer-Drawer > div',
                style: JoyRideStyles.tooltipStyle,
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                title: 'Filters',
            },
            {
                position: 'bottom',
                selector: '.qa-SearchAOIToolbar-typeahead',
                style: JoyRideStyles.tooltipStyle,
                text: `Use the placename search as a spatial filter for DataPacks.
                    If a placename has an associated polygon, EventKit will return all DataPacks that intersect the polygon.
                    If the placename is a point or an MGRS coordinate, then EventKit will return all DataPacks that contain that point.`,
                title: 'Placename Search',
            },
            {
                position: 'left',
                selector: '.qa-DrawAOIToolbar-div',
                style: JoyRideStyles.tooltipStyle,
                text: `In addition to the placename filter, other spatial filters can be created using the bounding box,
                    draw, current view, or import functions in the spatial toolbar.
                    EventKit will return all DataPacks that intersect with a spatial filter.
                    A spatial filter can be removed by clicking the “X” button.`,
                title: 'Spatial Filters',
            },
            {
                position: 'bottom',
                selector: '.tour-datapack-options',
                style: JoyRideStyles.tooltipStyle,
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                title: 'Menu Options',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackListItem-subtitle-date',
                style: JoyRideStyles.tooltipStyle,
                text: 'Check the status (complete, running, error) of previously created DataPacks.',
                title: 'DataPack Status',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackViewButtons-Icons',
                style: JoyRideStyles.tooltipStyle,
                text: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                title: 'Change Views',
            },
            {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: JoyRideStyles.tooltipStyle,
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                title: 'Create DataPack',

            },
        ],
    },
    ExportAOI: [
        {
            position: 'bottom',
            selector: '.qa-BreadcrumbStepper-div-content',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `Creating DataPacks is the core function of EventKit.
                The process begins with defining an Area of Interest (AOI), then selecting Data Sources and output formats.`,
            title: 'Welcome to the Create DataPack Page',
        },
        {
            position: 'bottom',
            selector: '.qa-SearchAOIToolbar-typeahead',
            style: JoyRideStyles.tooltipStyle,
            text: `EventKit has several gazetteers that are searchable from the location search box,
                just start typing a location name and options appear.
                The gazetteer name appears in each search result, as does the geometry type of result.
                If the result is a polygon, it will display in the map and automatically become the AOI.
                If the result is a point, the map will zoom to that location and an AOI will have to be drawn.
                </br>MGRS coordinates can also be used.`,
            title: 'Search for Location',
        },
        {
            position: 'left',
            selector: '.qa-DrawAOIToolbar-div',
            style: JoyRideStyles.tooltipStyle,
            text: `In addition to location search, an AOI can be defined using several other tools,
                including Bounding Box, Freehand Draw, Current View, and Import.
                The Import function supports a range of file uploads, including GeoJSON, KML, GeoPackage, and zipped shapefile.
                After drawing or importing an AOI, it can be edited by moving any individual node.`,
            title: 'Define Area of Interest (AOI)',
        },
        {
            position: 'top',
            selector: '.qa-AoiInfobar-body',
            style: JoyRideStyles.tooltipStyle,
            text: `This dialog box displays information about your current Area of Interest (AOI),
                including the size (in square kilometers), and the maximum allowable AOI size.
                Note, there may be multiple maximum AOI sizes, as they can vary between individual data sources.
                Finally, this dialog contains the Buffer button, which is described in the next step.`,
            title: 'Area of Interest (AOI) Info',
        },
        {
            positition: 'top',
            selector: '.qa-BufferDialog-main',
            style: JoyRideStyles.tooltipStyle,
            text: `Any Area of Interest ( AOI) can be buffered using the Buffer tool.
                The buffer can be created dynamically using the slide  bar in the user interface,
                or a specific distance (in meters) can be entered. The maximum buffer is currently 10,000 meters.
                </br>
                Note, a buffer is required if the AOI is only a point (which can happen with the placename search and Import functions).`,
            title: 'Buffer',
        },
        {
            position: 'left',
            selector: '#selected_icon',
            style: JoyRideStyles.tooltipStyle,
            text: 'Delete the AOI by clicking the "X".',
            title: 'Cancel Selection',
        },
        {
            position: 'left',
            selector: '.qa-BreadcrumbStepper-Button-next',
            style: JoyRideStyles.tooltipStyle,
            text: `Once the area of interest is set,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Select Data and Formats page`,
            title: 'Go to Select Data & Formats',
        },
    ],
    ExportInfo: [
        {
            position: 'bottom',
            selector: '.qa-BreadcrumbStepper-div-stepLabel',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `On the Select Data & Formats page, two basic steps must be accomplished.
                First, text information about the DataPack will be entered by the user,
                and second, selecting the data sources to be included in the DataPack.`,
            title: '',
        },
        {
            position: 'bottom',
            scrollToId: 'GeneralInfo',
            selector: '.qa-ExportInfo-general-info',
            style: JoyRideStyles.tooltipStyle,
            text: `Enter the general details and identifying information about the DataPack,
                including a Title and Description.
                Additionally, a Project Name field provides a way to tag a DataPack as belonging to a larger collection. 
                </br>
                Note, all the text entered here is indexed and can be search across in the DataPack Library.`,
            title: 'Enter General Information',
        },
        {
            position: 'left',
            scrollToId: 'ProviderList',
            selector: '.qa-ExportInfo-List',
            style: JoyRideStyles.tooltipStyle,
            text: `Select the individual data sources to be included in the DataPack.
                For each data source, additional information can be found by clicking the dropdown arrow on the right.`,
            title: 'Select Data Sources',
        },
        {
            position: 'left',
            scrollToId: 'ProviderStatus',
            selector: '.qa-ProviderStatusIcon',
            style: JoyRideStyles.tooltipStyle,
            text: `EventKit runs a series of checks on each data source to determine if its underlying web service is available,
                and the results are displayed in the Availability column.
                If a data source is available, a green check mark will be displayed.
                If the source is unavailable for any reason, an error icon will be shown here to indicate that something has gone wrong.
                Additional information about the error can be accessed by clicking on the error icon. 
                </br>
                In most cases, EventKit will allow you to keep an unavailable data source in a DataPack.
                This way if you “Run Export Again” at a later time, the data source may have become available.
                Exceptions to this include if the selected AOI exceeds the size limit for that data source.`,
            title: 'Data Source Availability',
        },
        {
            position: 'bottom',
            scrollToId: 'ExpandButton',
            selector: '.qa-DataProvider-ListItem-Expand',
            style: JoyRideStyles.tooltipStyle,
            text: 'Click here for additional information and options for the Data Source.',
            title: 'Additional Options',
        },
        {
            position: 'bottom',
            scrollToId: 'ZoomSelection',
            selector: '.qa-DataProvider-ListItem-zoomSelection',
            style: JoyRideStyles.tooltipStyle,
            text: 'Use The zoom bar to zoom in on the map.  That zoom level will be used to limit the data that is exported. '
                + 'Updating the map will update the estimated data size.',
            title: 'Zoom Level Selection',
        },
        {
            position: 'bottom',
            scrollToId: 'FormatSelection',
            selector: '.qa-DataProvider-ListItem-provFormats',
            style: JoyRideStyles.tooltipStyle,
            text: 'Different formats can be selected.  Data source types might have different options depending on if the source is '
                + 'elevation, raster, or vector data.',
            title: 'File Format Selection',
        },
        {
            position: 'left',
            scrollToId: 'Projections',
            selector: '.qa-ExportInfo-projections',
            style: JoyRideStyles.tooltipStyle,
            text: 'EventKit can output in different projections. '
                + 'Additional projection support can be added in subsequent versions of EventKit.',
            title: 'Projection',
        },
        {
            position: 'left',
            scrollToId: 'Map',
            selector: '.qa-MapCard-Card-map',
            style: JoyRideStyles.tooltipStyle,
            text: 'Expand the map to review the AOI that was selected on the previous screen.',
            title: 'Review Selected AOI',
        },
        {
            position: 'left',
            scrollToId: 'Next',
            selector: '.qa-BreadcrumbStepper-Button-next',
            style: JoyRideStyles.tooltipStyle,
            text: `Once all the text is entered and data sources selected,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Review & Submit page.`,
            title: 'Go to Review & Submit',
        },
    ],
    ExportSummary: [
        {
            position: 'bottom',
            selector: '.qa-BreadcrumbStepper-div-stepLabel',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `The Review & Submit page provides you the opportunity to
                review the details of the DataPack before submitting it for processing.`,
            title: '',
        },
        {
            position: 'bottom',
            scrollToId: 'Summary',
            selector: '.qa-ExportSummary-div',
            style: JoyRideStyles.tooltipStyle,
            text: 'Verify the information entered is correct before proceeding.',
            title: 'Verify Information',
        }, {
            position: 'bottom',
            scrollToId: 'Previous',
            selector: '.qa-BreadcrumbStepper-Button-previous',
            style: JoyRideStyles.tooltipStyle,
            text: `Once ready, click the large green button to complete the Create DataPack process.
                You will automatically be taken to the Status & Download page, where you can monitor the progress of the DataPack export.`,
            title: 'Edit Previous Steps',
        },
        {
            position: 'bottom',
            scrollToId: 'Next',
            selector: '.qa-BreadcrumbStepper-Button-next',
            style: JoyRideStyles.tooltipStyle,
            text: `Once ready, click the large green button to kick off the DataPack submission process.
                You will be redirected to the Status & Download page.`,
            title: 'Submit DataPack',
        },
    ],
    StatusAndDownload: [
        {
            position: 'top',
            selector: '.qa-PageHeader',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `You can review relevant information about the DataPack here such as its creation date,
                Area of Interest, and which data is included.
                Most importantly, you can download the data.`,
            title: 'Welcome to the Status & Download Page',
        },
        {
            position: 'bottom',
            scrollToId: 'Name',
            selector: '.qa-DataCartDetails-div-name',
            style: JoyRideStyles.tooltipStyle,
            text: 'This is the name that was entered for the name of the DataPack upon creation.',
            title: 'DataPack Info',
        },
        {
            position: 'bottom',
            scrollToId: 'Status',
            selector: '.qa-DataCartDetails-div-StatusContainer',
            style: JoyRideStyles.tooltipStyle,
            text: `This is the status of the DataPack.  Status reports include: submitted, completed, and failed.
                Here you can change the expiration date of the DataPack and also set the permission: Private or Shared.`,
            title: 'DataPack Status',
        },
        {
            position: 'bottom',
            scrollToId: 'DownloadOptions',
            selector: '.qa-DataPackDetails-providers',
            style: JoyRideStyles.tooltipStyle,
            text: `Each data source processes independently, and can finish at different times
                Therefore, each data source has a drop down that provides information on its progress,
                and links to directly download its data.`,
            title: 'Data Source Download Options',
        },
        {
            position: 'bottom',
            scrollToId: 'DownloadOptions',
            selector: '.qa-DataPackDetails-Button-zipButton',
            style: JoyRideStyles.tooltipStyle,
            text: `For convenience, EventKit bundles all the individual data sources into a single download (formatted as a .zip file).
                Additionally, this file contains GIS application files (QGIS and ArcMap),
                cartographic styles, metadata, and associated documents.`,
            title: 'Download Complete DataPack',
        },
        {
            position: 'bottom',
            scrollToId: 'OtherOptions',
            selector: '.qa-DataCartDetails-div-otherOptionsContainer',
            style: JoyRideStyles.tooltipStyle,
            text: `EventKit provides three additional DataPack management functions.
                “Run Export Again” over-writes the existing data with a new copy of the data sources.
                “Clone” creates a new export that maintains the existing Area of Interest and Data Source selections of the current job,
                which can then be customized as needed. “Delete” will delete the entire DataPack.
                If you created the DataPack or have Admin rights, you can “Run Export Again” or “Delete”, otherwise you can only “Clone”.`,
            title: 'Other Options',
        },
        {
            position: 'bottom',
            scrollToId: 'GeneralInfo',
            selector: '.qa-DataCartDetails-div-generalInfoContainer',
            style: JoyRideStyles.tooltipStyle,
            text: 'Here you will find additional information about the DataPack, including its data sources, projection, and formats.',
            title: 'General Information',
        },
        {
            position: 'bottom',
            scrollToId: 'Map',
            selector: '.qa-DataPackAoiInfo-div-map',
            style: JoyRideStyles.tooltipStyle,
            text: `This is the selected Area of Interest for the DataPack.
                The map window is interactive, allowing you to pan and zoom around the AOI.`,
            title: 'AOI',

        },
        {
            position: 'top',
            scrollToId: 'ExportInfo',
            selector: '.qa-DataCartDetails-div-exportInfoContainer',
            style: JoyRideStyles.tooltipStyle,
            text: `Here you will find specific information related to the processing of the DataPack.
                This information may be useful in reporting errors or problems with the DataPack.`,
            title: 'Export Information',
        },
    ],
    UserGroupsPage: [
        {
            position: 'top',
            selector: '.qa-PageHeader',
            style: JoyRideStyles.welcomeTooltipStyle,
            text: `EventKit allows you to easily share your data with other EventKit users.
                Here, you can create and administer groups, allowing you to share DataPacks with your team,
                customers, community of interest, etc.`,
            title: 'Welcome to the Members and Groups Page',
        },
        {
            position: 'top',
            selector: '.qa-UserGroupsPage-search',
            style: JoyRideStyles.tooltipStyle,
            text: 'You can search for users of EventKit by using this text search.  Search by name, username, or email.',
            title: 'Search',
        },
        {
            position: 'top',
            selector: '.qa-UserHeader-sort',
            style: JoyRideStyles.tooltipStyle,
            text: 'You can sort the members list by Name, Date Joined, and Administrator status.',
            title: 'Sort Members',
        },
        {
            position: 'top',
            selector: '.qa-UserGroupsPage-Button-create',
            style: JoyRideStyles.tooltipStyle,
            text: 'You can click the New Group button to create a new group.',
            title: 'Create Group',
        },
        {
            position: 'bottom',
            selector: '.qa-GroupsDrawer-addGroup',
            style: JoyRideStyles.tooltipStyle,
            text: 'You can click the New Group button to create a new group.',
            title: 'Create Group',
        },
        {
            position: 'bottom',
            selector: '.qa-GroupsDrawer-groupsHeading',
            style: JoyRideStyles.tooltipStyle,
            text: `Any group that you have Administrator rights to will appear in this section.
                For a further explanation of Administrator rights, click on the info icon next to the “ADMINSTRATOR” label.`,
            title: 'Groups: Administrator',
        },
        {
            position: 'bottom',
            selector: '.qa-UserRow-options',
            style: JoyRideStyles.tooltipStyle,
            text: `From dropdown menu you can add a user to an existing group or a new group.
                Additionally, within a group, you can grant or remove Administrator rights to a user.`,
            title: 'Add Individual User to Group',
        },
        {
            position: 'bottom',
            selector: '.qa-UserRow-checkbox',
            style: JoyRideStyles.tooltipStyle,
            text: 'Click the check box to select the user you would like to add to the group. Multiple selections can be made.',
            title: 'Select Individual Users',
        },
        {
            position: 'bottom',
            selector: '.qa-UserHeader-checkbox',
            style: JoyRideStyles.tooltipStyle,
            text: 'Clicking this checkbox selects all the users. ',
            title: 'Select All Users',
        },
        {
            position: 'bottom',
            selector: '.qa-UserHeader-options',
            style: JoyRideStyles.tooltipStyle,
            text: 'If multiple users are selected, the actions in this dropdown menu will apply to the set of selected users.',
            title: 'Add Users to Groups',
        },
        {
            position: 'bottom',
            selector: '.qa-GroupsDrawer-sharedGroupsHeading',
            style: JoyRideStyles.tooltipStyle,
            text: `Any group that has been shared with you, and that you do not have administrator rights, will appear in this section.
                For a further explanation of Member rights, click on the info button next to the “MEMBER ONLY” label.`,
            title: 'Groups: Member Only',
        },
    ],
};
