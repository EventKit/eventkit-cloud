type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

declare namespace Eventkit {
    interface License {
        slug: string;
        name: string;
        text: string;
    }

    namespace Permissions {
        type Visibility = 'PUBLIC' | 'PRIVATE' | 'SHARED';

        type Level = 'ADMIN' | 'READ' | '';

        interface Members {
            [username: string]: Level;
        }

        interface Groups {
            [groupname: string]: Level;
        }
    }

    interface Permissions {
        value: Permissions.Visibility;
        members: Permissions.Members;
        groups: Permissions.Groups;
    }

    interface Task {
        uid: string;
        url: string;
        name: string;
        status: string;
        progress: number;
        estimated_finish: string;
        started_at: string;
        finished_at: string;
        duration: string;
        result: {
            uid: string;
            filename: string;
            size: string;
            url: string;
            deleted: boolean;
        };
        errors: Array<{
            exception: string;
        }>;
        display: boolean;
    }

    interface ProviderTask {
        uid: string;
        url: string;
        name: string;
        description: string;
        started_at: string;
        finished_at: string;
        duration: string;
        tasks: Task[];
        status: string;
        display: boolean;
        slug: string;
        license: License;
        service_description: string;
    }

    interface Job {
        uid: string;
        name: string;
        event: string;
        description: string;
        url: string;
        extent: GeoJSON.Feature;
        original_selection: GeoJSON.GeoJSON;
        published: boolean;
        visibility: string;
        featured: boolean;
        formats: string[];
        created_at: string;
        relationship: Permissions.Level;
        permissions: Permissions;
    }

    interface Run {
        uid: string;
        url: string;
        created_at: string;
        started_at: string;
        finished_at: string;
        duration: string;
        user: string;
        status: string;
        job: Job;
        provider_tasks: string[];
        zipfile_url: string;
        expiration: string;
        deleted: boolean;
    }

    interface FullRun extends Omit<Run, 'provider_tasks'> {
        provider_tasks: ProviderTask[];
    }

    interface UserJobActivity {
        job: Job;
        last_export_run: Run;
        type: string;
        created_at: string;
    }

    interface Provider {
        id: number;
        model_url: string;
        type: string;
        license: License;
        created_at: string;
        updated_at: string;
        uid: string;
        name: string;
        slug: string;
        preview_url: string;
        service_copyright: string;
        service_description: string;
        layer: string;
        max_selection: string;
        level_from: number;
        level_to: number;
        zip: boolean;
        display: boolean;
        export_provider_type: number;
    }

    interface UserData {
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        last_login: string;
        date_joined: string;
        identification: string;
        commonname: string;
        permission?: string; // Certain API responses will include user permission level for a given target.
        fake?: boolean; // Used for adding fake users during page tours.
    }

    interface User {
        user: UserData;
        accepted_licenses: { [s: string]: boolean};
        groups: number[];
    }

    interface Group {
        id: string;
        name: string;
        members: string[];
        administrators: string[];
    }

    interface Notification {
        unread: boolean;
        deleted: boolean;
        level: string;
        verb: string;
        description: string;
        id: number;
        timestamp: string;
        recipient_id: number;
        actor: object;
        target: object;
        action_object: object;
    }

    interface Theme {
        eventkit: {
            colors: {
                primary: string;
                primary_light: string;
                primary_dark: string;
                secondary: string;
                secondary_light: string;
                secondary_dark: string;
                text_primary: string;
                warning: string;
                success: string;
                running: string;
                over: string;
                selected_primary: string;
                selected_primary_dark: string;
                selected_secondary: string;
                backdrop: string;
                background: string;
                background_light: string;
                white: string;
                black: string;
                grey: string;
            };
            images: {
                topo_dark: string;
                topo_light: string;
                logo: string;
            };
        };
    }

    namespace Store {
        interface User {
            data: Eventkit.User;
            meta: {
                autoLogoutAt: string;
                autoLogoutWarningAt: string;
            };
            status: {
                patched: boolean;
                patching: boolean;
                error: any;
                isLoading: boolean;
            };
        }

        interface RunDeletion {
            deleted: boolean;
            deleting: boolean;
            error: any;
        }

        interface ReRun {
            fetched: boolean;
            error: any;
        }

        interface UpdatePermissions {
            updated: boolean;
            updating: boolean;
            error: any;
        }

        interface UpdateExpiration {
            updated: boolean;
            updating: boolean;
            error: any;
        }

        interface RunsList {
            data: RunsListData;
            status: RunsListStatus;
        }

        interface RunsListData {
            nextPage: boolean;
            order: string;
            range: string;
            runs: Eventkit.Run[];
            view: string;
        }

        interface RunsListStatus {
            cancelSource: object;
            error: any;
            fetched: boolean;
            fetching: boolean;
        }

        interface Notifications {
            status: NotificationsStatus;
            data: NotificationsData;
            unreadCount: {
                status: UnreadCountStatus;
                data: UnreadCountData;
            };
        }

        interface NotificationsStatus {
            cancelSource: object;
            error: any;
            fetched: boolean;
            fetching: boolean;
        }

        interface NotificationsData {
            notifications: Eventkit.Notification[];
            notificationsSorted: Eventkit.Notification[];
            nextPage: boolean;
            range: string;
        }

        interface UnreadCountStatus {
            cancelSource: object;
            error: any;
            fetched: boolean;
            fetching: boolean;
        }

        interface UnreadCountData {
            unreadCount: number;
        }

        interface Users {
            error: any;
            fetched: boolean;
            fetching: boolean;
            new: number;
            total: number;
            ungrouped: number;
            range: string;
            nextPage: boolean;
            users: Eventkit.User[];
        }

        interface Groups {
            cancelSource: object;
            created: boolean;
            creating: boolean;
            deleted: boolean;
            deleting: boolean;
            error: any;
            fetched: boolean;
            fetching: boolean;
            groups: Eventkit.Group[];
            updated: boolean;
            updating: boolean;
        }

        interface UserActivity {
            viewedJobs: {
                fetched: boolean;
                fetching: boolean;
                nextPage: boolean;
                range: string;
                cancelSource: object;
                error: any;
                viewedJobs: Eventkit.Run[];
            };
        }

        interface Licenses {
            fetching: boolean;
            fetched: boolean;
            licenses: License[];
            error: any;
        }

        interface ExportInfo {
            areaStr: string;
            datapackDescription: string;
            exportName: string;
            formats: string[];
            projectName: string;
            providers: Provider[];
        }

        interface AoiInfo {
            buffer: number;
            description: string;
            geojson: GeoJSON.FeatureCollection;
            geomType: string;
            originalGeojson: GeoJSON.FeatureCollection;
            selectionType: string;
            title: string;
        }

        interface ImportGeom {
            processed: boolean;
            processing: boolean;
            filename: string;
            featureCollection: GeoJSON.FeatureCollection;
            error: any;
        }
    }
}
