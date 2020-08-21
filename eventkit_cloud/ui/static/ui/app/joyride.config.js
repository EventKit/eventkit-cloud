import { colors } from './styles/eventkit_theme';

function fillDefaults(steps) {
    return steps.map((step) => {
        if (step.disableBeacon === undefined) {
            // eslint-disable-next-line no-param-reassign
            step.disableBeacon = true;
        }
        return step;
    });
}

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
    Account: fillDefaults([
        {
            disableBeacon: true,
            title: 'Welcome to the Account Settings Page',
            content: `This page contains Licenses and Terms of Use along with some personal information.
                On your initial login, you must agree to these Licenses and Terms of Use to use EventKit.
                You will only be required to re-visit this page in the future if new Licenses and
                Terms of Use are introduced with a new data provider.`,
            target: '.qa-PageHeader',
            placement: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'License Agreement Info',
            content: 'You can expand the license text and scroll down to review.  You can download the license text if you so choose.',
            target: '.qa-UserLicense-expand',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Agree to Licenses',
            content: 'Once you’ve reviewed the licenses, you must agree to them. You can agree to each license individually.',
            target: '.qa-UserLicense-Checkbox',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Agree to Licenses',
            content: 'Or you can agree to them collectively.',
            target: '.qa-LicenseInfo-Checkbox',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Save Agreements',
            content: 'Once you have agreed to the licenses, click Save Changes.',
            target: '.qa-SaveButton-Button-SaveChanges',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Navigate Application',
            content: 'Once you have saved the license agreements, you can navigate away from the page to browse DataPacks.',
            target: '.qa-Drawer-MenuItem-exports',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Navigate Application',
            content: 'Or to create your own DataPack.',
            target: '.qa-Drawer-MenuItem-create',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    ExportAOI: fillDefaults([
        {
            disableBeacon: true,
            title: 'Welcome to the Create DataPack Page',
            content: `Creating DataPacks is the core function of EventKit.
                The process begins with defining an Area of Interest (AOI), then selecting Data Sources and output formats.`,
            target: '.qa-BreadcrumbStepper-div-content',
            placement: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Search for Location',
            content: `EventKit has several gazetteers that are searchable from the location search box,
                just start typing a location name and options appear.
                The gazetteer name appears in each search result, as does the geometry type of result.
                If the result is a polygon, it will display in the map and automatically become the AOI.
                If the result is a point, the map will zoom to that location and an AOI will have to be drawn.
                </br>MGRS coordinates can also be used.`,
            target: '.qa-SearchAOIToolbar-typeahead',
            placement: 'right',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Define Area of Interest (AOI)',
            content: `In addition to location search, an AOI can be defined using several other tools,
                including Bounding Box, Freehand Draw, Current View, and Import.
                The Import function supports a range of file uploads, including GeoJSON, KML, GeoPackage, and zipped shapefile.
                After drawing or importing an AOI, it can be edited by moving any individual node.`,
            target: '.qa-DrawAOIToolbar-div',
            placement: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Area of Interest (AOI) Info',
            content: `This dialog box displays information about your current Area of Interest (AOI),
                including the size (in square kilometers), and the maximum allowable AOI size.
                Note, there may be multiple maximum AOI sizes, as they can vary between individual data sources.
                Finally, this dialog contains the Buffer button, which is described in the next step.`,
            target: '.qa-AoiInfobar-body',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Buffer',
            content: `Any Area of Interest ( AOI) can be buffered using the Buffer tool.
                The buffer can be created dynamically using the slide  bar in the user interface,
                or a specific distance (in meters) can be entered. The maximum buffer is currently 10,000 meters.
                </br>
                Note, a buffer is required if the AOI is only a point (which can happen with the placename search and Import functions).`,
            target: '.qa-BufferDialog-main',
            positition: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Cancel Selection',
            content: 'Delete the AOI by clicking the "X".',
            target: '#selected_icon',
            placement: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Go to Select Data & Formats',
            content: `Once the area of interest is set,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Select Data and Formats page`,
            target: '.qa-BreadcrumbStepper-Button-next',
            placement: 'left',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    ExportInfo: fillDefaults([
        {
            disableBeacon: true,
            title: '',
            content: `On the Select Data & Formats page, two basic steps must be accomplished.
                First, text information about the DataPack will be entered by the user,
                and second, selecting the data sources to be included in the DataPack.`,
            target: '.qa-BreadcrumbStepper-div-stepLabel',
            placement: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Enter General Information',
            content: `Enter the general details and identifying information about the DataPack,
                including a Title and Description.
                Additionally, a Project Name field provides a way to tag a DataPack as belonging to a larger collection. 
                </br>
                Note, all the text entered here is indexed and can be search across in the DataPack Library.`,
            target: '.qa-ExportInfo-general-info',
            placement: 'bottom',
            scrollToId: 'GeneralInfo',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select Data Sources',
            content: `Select the individual data sources to be included in the DataPack.
                For each data source, additional information can be found by clicking the dropdown arrow on the right.`,
            target: '.qa-ExportInfo-List',
            placement: 'left',
            scrollToId: 'ProviderList',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Data Source Availability',
            content: `EventKit runs a series of checks on each data source to determine if its underlying web service is available,
                and the results are displayed in the Availability column.
                If a data source is available, a green check mark will be displayed.
                If the source is unavailable for any reason, an error icon will be shown here to indicate that something has gone wrong.
                Additional information about the error can be accessed by clicking on the error icon. 
                </br>
                In most cases, EventKit will allow you to keep an unavailable data source in a DataPack.
                This way if you “Run Export Again” at a later time, the data source may have become available.
                Exceptions to this include if the selected AOI exceeds the size limit for that data source.`,
            target: '.qa-ProviderStatusIcon',
            placement: 'left',
            scrollToId: 'ProviderStatus',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Additional Options',
            content: 'Click here for additional information and options for the Data Source.',
            target: '.qa-DataProvider-ListItem-Expand',
            placement: 'bottom',
            scrollToId: 'ExpandButton',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Zoom Level Selection',
            content: 'Use The zoom bar to zoom in on the map.  That zoom level will be used to limit the data that is exported. '
                + 'Updating the map will update the estimated data size.',
            target: '.qa-DataProvider-ListItem-zoomSelection',
            placement: 'bottom',
            scrollToId: 'ZoomSelection',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'File Format Selection',
            content: 'Different formats can be selected.  Data source types might have different options depending on if the source is '
                + 'elevation, raster, or vector data.',
            target: '.qa-DataProvider-ListItem-provFormats',
            placement: 'bottom',
            scrollToId: 'FormatSelection',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Projection',
            content: 'EventKit can output in different projections. '
                + 'Additional projection support can be added in subsequent versions of EventKit.',
            target: '.qa-ExportInfo-projections',
            placement: 'left',
            scrollToId: 'Projections',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Review Selected AOI',
            content: 'Expand the map to review the AOI that was selected on the previous screen.',
            target: '.qa-MapCard-Card-map',
            placement: 'left',
            scrollToId: 'Map',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Go to Review & Submit',
            content: `Once all the text is entered and data sources selected,
                move to the next step in the Create DataPack process by clicking the green arrow button.
                This will take you to the Review & Submit page.`,
            target: '.qa-BreadcrumbStepper-Button-next',
            placement: 'left',
            scrollToId: 'Next',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    ExportSummary: fillDefaults([
        {
            disableBeacon: true,
            title: '',
            content: `The Review & Submit page provides you the opportunity to
                review the details of the DataPack before submitting it for processing.`,
            target: '.qa-BreadcrumbStepper-div-stepLabel',
            placement: 'bottom',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Verify Information',
            content: 'Verify the information entered is correct before proceeding.',
            target: '.qa-ExportSummary-div',
            placement: 'bottom',
            scrollToId: 'Summary',
            style: JoyRideStyles.tooltipStyle,
        }, {
            title: 'Edit Previous Steps',
            content: `Once ready, click the large green button to complete the Create DataPack process.
                You will automatically be taken to the Status & Download page, where you can monitor the progress of the DataPack export.`,
            target: '.qa-BreadcrumbStepper-Button-previous',
            placement: 'bottom',
            scrollToId: 'Previous',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Submit DataPack',
            content: `Once ready, click the large green button to kick off the DataPack submission process.
                You will be redirected to the Status & Download page.`,
            target: '.qa-BreadcrumbStepper-Button-next',
            placement: 'bottom',
            scrollToId: 'Next',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    StatusAndDownload: fillDefaults([
        {
            disableBeacon: true,
            title: 'Welcome to the Status & Download Page',
            content: `You can review relevant information about the DataPack here such as its creation date,
                Area of Interest, and which data is included.
                Most importantly, you can download the data.`,
            target: '.qa-PageHeader',
            placement: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'DataPack Info',
            content: 'This is the name that was entered for the name of the DataPack upon creation.',
            target: '.qa-DataCartDetails-div-name',
            placement: 'bottom',
            scrollToId: 'Name',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'DataPack Status',
            content: `This is the status of the DataPack.  Status reports include: submitted, completed, and failed.
                Here you can change the expiration date of the DataPack and also set the permission: Private or Shared.`,
            target: '.qa-DataCartDetails-div-StatusContainer',
            placement: 'bottom',
            scrollToId: 'Status',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Data Source Download Options',
            content: `Each data source processes independently, and can finish at different times
                Therefore, each data source has a drop down that provides information on its progress,
                and links to directly download its data.`,
            target: '.qa-DataPackDetails-providers',
            placement: 'bottom',
            scrollToId: 'DownloadOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Download Complete DataPack',
            content: `For convenience, EventKit bundles all the individual data sources into a single download (formatted as a .zip file).
                Additionally, this file contains GIS application files (QGIS and ArcMap),
                cartographic styles, metadata, and associated documents.`,
            target: '.qa-DataPackDetails-Button-zipButton',
            placement: 'bottom',
            scrollToId: 'DownloadOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Other Options',
            content: `EventKit provides three additional DataPack management functions.
                “Run Export Again” over-writes the existing data with a new copy of the data sources.
                “Clone” creates a new export that maintains the existing Area of Interest and Data Source selections of the current job,
                which can then be customized as needed. “Delete” will delete the entire DataPack.
                If you created the DataPack or have Admin rights, you can “Run Export Again” or “Delete”, otherwise you can only “Clone”.`,
            target: '.qa-DataCartDetails-div-otherOptionsContainer',
            placement: 'bottom',
            scrollToId: 'OtherOptions',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'General Information',
            content: 'Here you will find additional information about the DataPack, including its data sources, projection, and formats.',
            target: '.qa-DataCartDetails-div-generalInfoContainer',
            placement: 'bottom',
            scrollToId: 'GeneralInfo',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'AOI',
            content: `This is the selected Area of Interest for the DataPack.
                The map window is interactive, allowing you to pan and zoom around the AOI.`,
            target: '.qa-DataPackAoiInfo-div-map',
            placement: 'bottom',
            scrollToId: 'Map',
            style: JoyRideStyles.tooltipStyle,

        },
        {
            title: 'Export Information',
            content: `Here you will find specific information related to the processing of the DataPack.
                This information may be useful in reporting errors or problems with the DataPack.`,
            target: '.qa-DataCartDetails-div-exportInfoContainer',
            placement: 'top',
            scrollToId: 'ExportInfo',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    DataPackPage: {
        list: fillDefaults([
            {
                disableBeacon: true,
                title: 'Welcome to the DataPack Library.',
                content: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                target: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                placement: 'top',
            },
            {
                title: 'DataPacks',
                content: `By default, EventKit will show the most recent subset of DataPacks in the list view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                target: '.qa-DataPackList-root',
                style: JoyRideStyles.tooltipStyle,
                placement: 'bottom',
            },
            {
                title: 'Text Search',
                content: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                target: '.qa-DataPackSearchBar-TextField',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                content: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                target: '.qa-FilterDrawer-Drawer > div',
                placement: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'DataPack Status',
                content: 'Check the status (complete, running, error) of previously created DataPacks.',
                target: '.tour-datapack-status',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Menu Options',
                content: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                target: '.tour-datapack-options',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Change Views',
                content: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                target: '.qa-DataPackViewButtons-Icons',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                content: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                target: '.qa-DataPackLinkButton-Button',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
        ]),
        grid: fillDefaults([
            {
                disableBeacon: true,
                title: 'Welcome to the DataPack Library.',
                content: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                target: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                placement: 'top',
            },
            {
                title: 'DataPacks',
                content: `By default, EventKit will show the most recent subset of DataPacks in the grid view.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                target: '.qa-DataPackPage-view',
                style: JoyRideStyles.tooltipStyle,
                placement: 'bottom',
            },
            {
                title: 'Text Search',
                content: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                target: '.qa-DataPackSearchBar-TextField',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                content: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                target: '.qa-FilterDrawer-Drawer > div',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'DataPack Status',
                content: 'Check the status (complete, running, error) of previously created DataPacks.',
                target: '.qa-DataPackGridItem-CardActions',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Menu Options',
                content: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                target: '.tour-datapack-options',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Change Views',
                content: `Change the view of the DataPack Library,
                    options include the default map view, a “baseball card” view, and traditional table view.`,
                target: '.qa-DataPackViewButtons-Icons',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                content: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                target: '.qa-DataPackLinkButton-Button',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
        ]),
        map: fillDefaults([
            {
                disableBeacon: true,
                title: 'Welcome to the DataPack Library',
                content: `DataPacks are the core elements of EventKit.
                    Use the DataPack Library to review existing DataPacks, visualize them on a map,
                    search based on name, date, and data source, and find “Featured DataPacks”.`,
                target: '.qa-DataPackPage-Toolbar-sort',
                style: JoyRideStyles.welcomeTooltipStyle,
                placement: 'top',
            },
            {
                title: 'DataPacks',
                content: `By default, EventKit will show the most recent subset of DataPacks in the map view.
                    Clicking on a DataPack in the list will highlight its location on the map, and vice versa.
                    </br>To display more DataPacks, click on the Show More button at the bottom,
                    or use the other search functions (explained in the following steps).`,
                target: '.qa-MapView-GridList',
                style: JoyRideStyles.tooltipStyle,
                placement: 'right',
            },
            {
                title: 'Text Search',
                content: `The text search function filters across all DataPacks based on the name,
                    description, and project fields provided for each DataPack.`,
                target: '.qa-DataPackSearchBar-TextField',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Filters',
                content: `Filter DataPacks based on sharing permissions, date range, job status, and data sources.
                    To filter Shared DataPacks, select Shared and click on the “All Members / All Groups” link.
                    This will open the “Filter Shared DataPacks” dialog box to select specific users or groups.`,
                target: '.qa-FilterDrawer-Drawer > div > div > div > .qa-DateFilter-div',
                placement: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Placename Search',
                content: `Use the placename search as a spatial filter for DataPacks.
                    If a placename has an associated polygon, EventKit will return all DataPacks that intersect the polygon.
                    If the placename is a point or an MGRS coordinate, then EventKit will return all DataPacks that contain that point.`,
                target: '.qa-SearchAOIToolbar-typeahead',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Spatial Filters',
                content: `In addition to the placename filter, other spatial filters can be created using the bounding box,
                    draw, current view, or import functions in the spatial toolbar.
                    EventKit will return all DataPacks that intersect with a spatial filter.
                    A spatial filter can be removed by clicking the “X” button.`,
                target: '.qa-DrawAOIToolbar-div',
                placement: 'left',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Menu Options',
                content: `Use this menu to navigate to the “Status & Download” page where you can download the DataPack files,
                    share the DataPack with other EventKit users, or delete the datapack.`,
                target: '.tour-datapack-options',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'DataPack Status',
                content: 'Check the status (complete, running, error) of previously created DataPacks.',
                target: '.qa-DataPackListItem-subtitle-date',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Change Views',
                content: `Change the view of the DataPack Library, options include the default map view,
                    a “baseball card” view, and traditional table view.`,
                target: '.qa-DataPackViewButtons-Icons',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,
            },
            {
                title: 'Create DataPack',
                content: `Click here to begin creating a DataPack.
                    This will leave the DataPack Library and take you to the Create DataPack page.`,
                target: '.qa-DataPackLinkButton-Button',
                placement: 'bottom',
                style: JoyRideStyles.tooltipStyle,

            },
        ]),
    },
    UserGroupsPage: fillDefaults([
        {
            disableBeacon: true,
            title: 'Welcome to the Members and Groups Page',
            content: `EventKit allows you to easily share your data with other EventKit users.
                Here, you can create and administer groups, allowing you to share DataPacks with your team,
                customers, community of interest, etc.`,
            target: '.qa-PageHeader',
            placement: 'top',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Search',
            content: 'You can search for users of EventKit by using this text search.  Search by name, username, or email.',
            target: '.qa-UserGroupsPage-search',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Sort Members',
            content: 'You can sort the members list by Name, Date Joined, and Administrator status.',
            target: '.qa-UserHeader-sort',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Create Group',
            content: 'You can click the New Group button to create a new group.',
            target: '.qa-UserGroupsPage-Button-create',
            placement: 'top',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Create Group',
            content: 'You can click the New Group button to create a new group.',
            target: '.qa-GroupsDrawer-addGroup',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Groups: Administrator',
            content: `Any group that you have Administrator rights to will appear in this section.
                For a further explanation of Administrator rights, click on the info icon next to the “ADMINSTRATOR” label.`,
            target: '.qa-GroupsDrawer-groupsHeading',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Add Individual User to Group',
            content: `From dropdown menu you can add a user to an existing group or a new group.
                Additionally, within a group, you can grant or remove Administrator rights to a user.`,
            target: '.qa-UserRow-options',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select Individual Users',
            content: 'Click the check box to select the user you would like to add to the group. Multiple selections can be made.',
            target: '.qa-UserRow-checkbox',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Select All Users',
            content: 'Clicking this checkbox selects all the users. ',
            target: '.qa-UserHeader-checkbox',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Add Users to Groups',
            content: 'If multiple users are selected, the actions in this dropdown menu will apply to the set of selected users.',
            target: '.qa-UserHeader-options',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Groups: Member Only',
            content: `Any group that has been shared with you, and that you do not have administrator rights, will appear in this section.
                For a further explanation of Member rights, click on the info button next to the “MEMBER ONLY” label.`,
            target: '.qa-GroupsDrawer-sharedGroupsHeading',
            placement: 'bottom',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
    DashboardPage: fillDefaults([
        {
            disableBeacon: true,
            title: 'Welcome to the Dashboard Page',
            content: `The Dashboard provides a curated view into EventKit content.
                Here, you’ll get notifications on relevant EventKit activity, get a personalized view into your content,
                and have easy access to the Featured DataPacks.
                You’ll land on this page each time you login to EventKit.`,
            target: '.qa-PageHeader',
            placement: 'top',
            scrollToId: 'Dashboard',
            style: JoyRideStyles.welcomeTooltipStyle,
        },
        {
            title: 'Notifications',
            content: `You’ll receive notifications here updating you on your DataPack’s progress,
                along with information on how and when DataPacks are shared.
                To view all of your notifcations and manage them, click view all,
                or select the notification bell icon in the upper left of the screen.`,
            target: '.qa-DashboardSection-Notifications',
            placement: 'top',
            scrollToId: 'DashboardSectionNotifications',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Recently Viewed',
            content: `As the name implies, this section shows you which DataPacks you have recently viewed.
                The DataPacks are organized chronologically – meaning the first DataPack you see on the left
                will be the most recent one you viewed`,
            target: '.qa-DashboardSection-Recently.Viewed',
            placement: 'bottom',
            scrollToId: 'DashboardSectionRecently Viewed',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'Featured',
            content: `EventKit has a concept of Featured DataPacks, where administrators will highlight certain DataPacks that
                may be relevant to a large section of the community e.g., a recent hurricane. 
                If you want to suggest promoting one of your DataPacks, reach out to the EventKit team from the About page.`,
            target: '.qa-DashboardSection-Featured',
            placement: 'bottom',
            scrollToId: 'DashboardSectionFeatured',
            style: JoyRideStyles.tooltipStyle,
        },
        {
            title: 'My DataPacks',
            content: `Finally, you can view the DataPacks that you’ve created.
                Keep in mind that by default DataPacks expire after two weeks,
                though you can reset the expiration as often as you need to by clicking on the DataPack and hitting the Expires field.`,
            target: '.qa-DashboardSection-My.DataPacks',
            placement: 'top',
            scrollToId: 'DashboardSectionMy DataPacks',
            style: JoyRideStyles.tooltipStyle,
        },
    ]),
};
