import { colors } from './styles/eventkit_theme';

export const JoyRideStyles = {
    tooltipStyle: {
        backgroundColor: colors.white,
        borderRadius: '0',
        color: colors.black,
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: colors.primary,
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },
        button: {
            color: colors.white,
            backgroundColor: colors.primary,
        },
        skip: {
            display: 'none',
        },
        back: {
            color: colors.text_primary,
        },
        hole: {
            backgroundColor: 'rgba(226,226,226, 0.2)',
        },
    },
    welcomeTooltipStyle: {
        backgroundColor: colors.white,
        borderRadius: '0',
        color: colors.black,
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: colors.primary,
        },
        arrow: {
            display: 'none',
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },

        button: {
            color: colors.white,
            backgroundColor: colors.primary,
        },
        skip: {
            display: 'none',
        },
        back: {
            color: colors.text_primary,
        },
        hole: {
            display: 'none',
        },
    },
};

export const joyride = {
    Account: [
        {
            title: 'Welcome to the Account Settings Page',
            text: `This page contains Licenses and Terms of Use along with some personal information.
                On your initial login, you must agree to these Licenses and Terms of Use to use EventKit.
                You will only be required to re-visit this page in the future if new Licenses and
                Terms of Use are introduced with a new data provider.`,
            selector: '.qa-PageHeader',
            position: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'License Agreement Info',
            text: 'You can expand the license text and scroll down to review.  You can download the license text if you so choose.',
            selector: '.qa-UserLicense-expand',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Agree to Licenses',
            text: 'Once you’ve reviewed the licenses, you must agree to them. You can agree to each license individually.',
            selector: '.qa-UserLicense-Checkbox',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Agree to Licenses',
            text: 'Or you can agree to them collectively.',
            selector: '.qa-LicenseInfo-Checkbox',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Save Agreements',
            text: 'Once you have agreed to the licenses, click Save Changes.',
            selector: '.qa-SaveButton-Button-SaveChanges',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Navigate Application',
            text: 'Once you have saved the license agreements, you can navigate away from the page to browse DataPacks.',
            selector: '.qa-Drawer-MenuItem-exports',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Navigate Application',
            text: 'Or to create your own DataPack.',
            selector: '.qa-Drawer-MenuItem-create',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    ExportAOI: [
        {
            title: 'Welcome to the Create DataPack Page',
            text: `Creating DataPacks is the core function of EventKit.
                The process begins with defining an Area of Interest (AOI), then selecting Data Sources and output formats.`,
            selector: '.qa-BreadcrumbStepper-div-content',
            position: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Search for Location',
            text: `EventKit has several gazetteers that are searchable from the location search box,
                just start typing a location name and options appear.
                The gazetteer name appears in each search result, as does the geometry type of result.
                If the result is a polygon, it will display in the map and automatically become the AOI.
                If the result is a point, the map will zoom to that location and an AOI will have to be drawn.
                </br>MGRS coordinates can also be used.`,
            selector: '.qa-SearchAOIToolbar-typeahead',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Define Area of Interest (AOI)',
            text: `In addition to location search, an AOI can be defined using several other tools,
                including Bounding Box, Freehand Draw, Current View, and Import.
                The Import function supports a range of file uploads, including GeoJSON, KML, GeoPackage, and zipped shapefile.
                After drawing or importing an AOI, it can be edited by moving any individual node.`,
            selector: '.qa-DrawAOIToolbar-div',
            position: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Area of Interest (AOI) Info',
            text: `This dialog box displays information about your current Area of Interest (AOI),
                including the size (in square kilometers), and the maximum allowable AOI size.
                Note, there may be multiple maximum AOI sizes, as they can vary between individual data sources.
                Finally, this dialog contains the Buffer button, which is described in the next step.`,
            selector: '.qa-AoiInfobar-body',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Buffer',
            text: `Any Area of Interest ( AOI) can be buffered using the Buffer tool.
                The buffer can be created dynamically using the slide  bar in the user interface,
                or a specific distance (in meters) can be entered. The maximum buffer is currently 10,000 meters.
                </br>
                Note, a buffer is required if the AOI is only a point (which can happen with the placename search and Import functions).`,
            selector: '.qa-BufferDialog-main',
            positition: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Cancel Selection',
            text: 'Delete the AOI by clicking the "X".',
            selector: '#selected_icon',
            position: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Go to Select Data & Formats',
            text: `Once the area of interest is set,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Select Data and Formats page`,
            selector: '.qa-BreadcrumbStepper-Button-next',
            position: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    ExportInfo: [
        {
            title: '',
            text: `On the Select Data & Formats page, two basic steps must be accomplished.
                First, text information about the DataPack will be entered by the user,
                and second, selecting the data sources to be included in the DataPack.`,
            selector: '.qa-BreadcrumbStepper-div-stepLabel',
            position: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Enter General Information',
            text: `Enter the general details and identifying information about the DataPack,
                including a Title and Description.
                Additionally, a Project Name field provides a way to tag a DataPack as belonging to a larger collection. 
                </br>
                Note, all the text entered here is indexed and can be search across in the DataPack Library.`,
            selector: '.qa-ExportInfo-general-info',
            position: 'bottom',
            scrollToId: 'GeneralInfo',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select Data Sources',
            text: `Select the individual data sources to be included in the DataPack.
                For each data source, additional information can be found by clicking the dropdown arrow on the right.`,
            selector: '.qa-ExportInfo-List',
            position: 'left',
            scrollToId: 'ProviderList',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Data Source Availability',
            text: `EventKit runs a series of checks on each data source to determine if its underlying web service is available,
                and the results are displayed in the Availability column.
                If a data source is available, a green check mark will be displayed.
                If the source is unavailable for any reason, an error icon will be shown here to indicate that something has gone wrong.
                Additional information about the error can be accessed by clicking on the error icon. 
                </br>
                In most cases, EventKit will allow you to keep an unavailable data source in a DataPack.
                This way if you “Run Export Again” at a later time, the data source may have become available.
                Exceptions to this include if the selected AOI exceeds the size limit for that data source.`,
            selector: '.qa-ProviderStatusIcon',
            position: 'left',
            scrollToId: 'ProviderStatus',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Projection',
            text: `At this time, EventKit shows one projection, World Geodetic System 1984 (WGS 84) projection.
                This projection is also commonly known by its EPSG code: 4326.
                Additional projection support will be added in subsequent versions of EventKit.`,
            selector: '.qa-ExportInfo-projections',
            position: 'left',
            scrollToId: 'Projections',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Review Selected AOI',
            text: 'Expand the map to review the AOI that was selected on the previous screen.',
            selector: '.qa-MapCard-Card-map',
            position: 'left',
            scrollToId: 'Map',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Go to Review & Submit',
            text: `Once all the text is entered and data sources selected,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Review & Submit page.`,
            selector: '.qa-BreadcrumbStepper-Button-next',
            position: 'left',
            scrollToId: 'Next',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    ExportSummary: [
        {
            title: '',
            text: `The Review & Submit page provides you the opportunity to
                review the details of the DataPack before submitting it for processing.`,
            selector: '.qa-BreadcrumbStepper-div-stepLabel',
            position: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Verify Information',
            text: 'Verify the information entered is correct before proceeding.',
            selector: '.qa-ExportSummary-div',
            position: 'bottom',
            scrollToId: 'Summary',
            style: JoyRideStyles.tooltipStyle,
        }, {
            title: 'Edit Previous Steps',
            text: `Once ready, click the large green button to complete the Create DataPack process.
                You will automatically be taken to the Status & Download page, where you can monitor the progress of the DataPack export.`,
            selector: '.qa-BreadcrumbStepper-Button-previous',
            position: 'bottom',
            scrollToId: 'Previous',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Submit DataPack',
            text: `Once ready, click the large green button to kick off the DataPack submission process.
                You will be redirected to the Status & Download page.`,
            selector: '.qa-BreadcrumbStepper-Button-next',
            position: 'bottom',
            scrollToId: 'Next',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    StatusAndDownload: [
        {
            title: 'Welcome to the Status & Download Page',
            text: `You can review relevant information about the DataPack here such as its creation date,
                Area of Interest, and which data is included.
                Most importantly, you can download the data.`,
            selector: '.qa-PageHeader',
            position: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'DataPack Info',
            text: 'This is the name that was entered for the name of the DataPack upon creation.',
            selector: '.qa-DataCartDetails-div-name',
            position: 'bottom',
            scrollToId: 'Name',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'DataPack Status',
            text: `This is the status of the DataPack.  Status reports include: submitted, completed, and failed.
                Here you can change the expiration date of the DataPack and also set the permission: Private or Shared.`,
            selector: '.qa-DataCartDetails-div-StatusContainer',
            position: 'bottom',
            scrollToId: 'Status',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Data Source Download Options',
            text: `Each data source processes independently, and can finish at different times
                Therefore, each data source has a drop down that provides information on its progress,
                and links to directly download its data.`,
            selector: '.qa-DataPackDetails-providers',
            position: 'bottom',
            scrollToId: 'DownloadOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Download Complete DataPack',
            text: `For convenience, EventKit bundles all the individual data sources into a single download (formatted as a .zip file).
                Additionally, this file contains GIS application files (QGIS and ArcMap),
                cartographic styles, metadata, and associated documents.`,
            selector: '.qa-DataPackDetails-Button-zipButton',
            position: 'bottom',
            scrollToId: 'DownloadOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Other Options',
            text: `EventKit provides three additional DataPack management functions.
                “Run Export Again” over-writes the existing data with a new copy of the data sources.
                “Clone” creates a new export that maintains the existing Area of Interest and Data Source selections of the current job,
                which can then be customized as needed. “Delete” will delete the entire DataPack.
                If you created the DataPack or have Admin rights, you can “Run Export Again” or “Delete”, otherwise you can only “Clone”.`,
            selector: '.qa-DataCartDetails-div-otherOptionsContainer',
            position: 'bottom',
            scrollToId: 'OtherOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'General Information',
            text: 'Here you will find additional information about the DataPack, including its data sources, projection, and formats.',
            selector: '.qa-DataCartDetails-div-generalInfoContainer',
            position: 'bottom',
            scrollToId: 'GeneralInfo',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'AOI',
            text: `This is the selected Area of Interest for the DataPack.
                The map window is interactive, allowing you to pan and zoom around the AOI.`,
            selector: '.qa-DataPackAoiInfo-div-map',
            position: 'bottom',
            scrollToId: 'Map',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Export Information',
            text: `Here you will find specific information related to the processing of the DataPack.
                This information may be useful in reporting errors or problems with the DataPack.`,
            selector: '.qa-DataCartDetails-div-exportInfoContainer',
            position: 'top',
            scrollToId: 'ExportInfo',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    DataPackPage: {
        list: [
            {
                title: 'Welcome to the DataPack Library.',
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                position: 'top',
            },
            {
                title: 'DataPacks',
                text: `By default, EventKit will show the most recent subset of DataPacks in the list view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                selector: '.qa-DataPackList-root',
                style: JoyRideStyles.tooltipStyle,
                position: 'bottom',
            },
            {
                title: 'Text Search',
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                selector: '.qa-DataPackSearchBar-TextField',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                selector: '.qa-FilterDrawer-Drawer > div',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'DataPack Status',
                text: 'Check the status (complete, running, error) of previously created DataPacks.',
                selector: '.tour-datapack-status',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Menu Options',
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                selector: '.tour-datapack-options',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Change Views',
                text: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                selector: '.qa-DataPackViewButtons-Icons',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                selector: '.qa-DataPackLinkButton-Button',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
        ],
        grid: [
            {
                title: 'Welcome to the DataPack Library.',
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                position: 'top',
            },
            {
                title: 'DataPacks',
                text: `By default, EventKit will show the most recent subset of DataPacks in the grid view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                selector: '.qa-DataPackPage-view',
                style: JoyRideStyles.tooltipStyle,
                position: 'bottom',
            },
            {
                title: 'Text Search',
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                selector: '.qa-DataPackSearchBar-TextField',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
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
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                selector: '.tour-datapack-options',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Change Views',
                text: `Change the view of the DataPack Library,
                    options include the default map view, a “baseball card” view, and traditional table view.`,
                selector: '.qa-DataPackViewButtons-Icons',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                selector: '.qa-DataPackLinkButton-Button',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
        ],
        map: [
            {
                title: 'Welcome to the DataPack Library',
                text: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                selector: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                position: 'top',
            },
            {
                title: 'DataPacks',
                text: `By default, EventKit will show the most recent subset of DataPacks in the map view.
                    Clicking on a DataPack in the list will highlight its location on the map, and vice versa.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                selector: '.qa-MapView-GridList',
                style: JoyRideStyles.tooltipStyle,
                position: 'right',
            },
            {
                title: 'Text Search',
                text: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                selector: '.qa-DataPackSearchBar-TextField',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                text: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                selector: '.qa-FilterDrawer-Drawer > div',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Placename Search',
                text: `Use the placename search as a spatial filter for DataPacks.
                    If a placename has an associated polygon, EventKit will return all DataPacks that intersect the polygon.
                    If the placename is a point or an MGRS coordinate, then EventKit will return all DataPacks that contain that point.`,
                selector: '.qa-SearchAOIToolbar-typeahead',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Spatial Filters',
                text: `In addition to the placename filter, other spatial filters can be created using the bounding box,
                    draw, current view, or import functions in the spatial toolbar.
                    EventKit will return all DataPacks that intersect with a spatial filter.
                    A spatial filter can be removed by clicking the “X” button.`,
                selector: '.qa-DrawAOIToolbar-div',
                position: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Menu Options',
                text: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                selector: '.tour-datapack-options',
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
                title: 'Change Views',
                text: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                selector: '.qa-DataPackViewButtons-Icons',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                text: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                selector: '.qa-DataPackLinkButton-Button',
                position: 'bottom',
                style: JoyRideStyles.tooltipStyle,

            },
        ],
    },
    UserGroupsPage: [
        {
            title: 'Welcome to the Members and Groups Page',
            text: `EventKit allows you to easily share your data with other EventKit users.
                Here, you can create and administer groups, allowing you to share DataPacks with your team,
                customers, community of interest, etc.`,
            selector: '.qa-PageHeader',
            position: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Search',
            text: 'You can search for users of EventKit by using this text search.  Search by name, username, or email.',
            selector: '.qa-UserGroupsPage-search',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Sort Members',
            text: 'You can sort the members list by Name, Date Joined, and Administrator status.',
            selector: '.qa-UserHeader-sort',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Create Group',
            text: 'You can click the New Group button to create a new group.',
            selector: '.qa-UserGroupsPage-Button-create',
            position: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Create Group',
            text: 'You can click the New Group button to create a new group.',
            selector: '.qa-GroupsDrawer-addGroup',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Groups: Administrator',
            text: `Any group that you have Administrator rights to will appear in this section.
                For a further explanation of Administrator rights, click on the info icon next to the “ADMINSTRATOR” label.`,
            selector: '.qa-GroupsDrawer-groupsHeading',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Add Individual User to Group',
            text: `From dropdown menu you can add a user to an existing group or a new group.
                Additionally, within a group, you can grant or remove Administrator rights to a user.`,
            selector: '.qa-UserRow-options',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select Individual Users',
            text: 'Click the check box to select the user you would like to add to the group. Multiple selections can be made.',
            selector: '.qa-UserRow-checkbox',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select All Users',
            text: 'Clicking this checkbox selects all the users. ',
            selector: '.qa-UserHeader-checkbox',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Add Users to Groups',
            text: 'If multiple users are selected, the actions in this dropdown menu will apply to the set of selected users.',
            selector: '.qa-UserHeader-options',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Groups: Member Only',
            text: `Any group that has been shared with you, and that you do not have administrator rights, will appear in this section.
                For a further explanation of Member rights, click on the info button next to the “MEMBER ONLY” label.`,
            selector: '.qa-GroupsDrawer-sharedGroupsHeading',
            position: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
    DashboardPage: [
        {
            title: 'Welcome to the Dashboard Page',
            text: `The Dashboard provides a curated view into EventKit content.
                Here, you’ll get notifications on relevant EventKit activity, get a personalized view into your content,
                and have easy access to the Featured DataPacks.
                You’ll land on this page each time you login to EventKit.`,
            selector: '.qa-PageHeader',
            position: 'top',
            scrollToId: 'Dashboard',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Notifications',
            text: `You’ll receive notifications here updating you on your DataPack’s progress,
                along with information on how and when DataPacks are shared.
                To view all of your notifcations and manage them, click view all,
                or select the notification bell icon in the upper left of the screen.`,
            selector: '.qa-DashboardSection-Notifications',
            position: 'top',
            scrollToId: 'DashboardSectionNotifications',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Recently Viewed',
            text: `As the name implies, this section shows you which DataPacks you have recently viewed.
                The DataPacks are organized chronologically – meaning the first DataPack you see on the left
                will be the most recent one you viewed`,
            selector: '.qa-DashboardSection-Recently.Viewed',
            position: 'bottom',
            scrollToId: 'DashboardSectionRecently Viewed',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Featured',
            text: `EventKit has a concept of Featured DataPacks, where administrators will highlight certain DataPacks that
                may be relevant to a large section of the community e.g., a recent hurricane. 
                If you want to suggest promoting one of your DataPacks, reach out to the EventKit team from the About page.`,
            selector: '.qa-DashboardSection-Featured',
            position: 'bottom',
            scrollToId: 'DashboardSectionFeatured',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'My DataPacks',
            text: `Finally, you can view the DataPacks that you’ve created.
                Keep in mind that by default DataPacks expire after two weeks,
                though you can reset the expiration as often as you need to by clicking on the DataPack and hitting the Expires field.`,
            selector: '.qa-DashboardSection-My.DataPacks',
            position: 'top',
            scrollToId: 'DashboardSectionMy DataPacks',
            style: JoyRideStyles.tooltipStyle,
        },
    ],
};
