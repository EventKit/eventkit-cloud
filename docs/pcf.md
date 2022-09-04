# Deploying on Pivotal Cloud Foundry

The application can be deployed on Pivotal Cloud Foundry.  However some special considerations need to be made.

The python buildpack uses conda to install dependencies.  Prior to pushing your PCF application you need to build the
conda dependencies and store them in a nexus repo.  Then list your custom repo (and/or public repos) in the
environment.yml file.  

## Settings

If wishing to use some PCF features to autoscale celery the following settings can be provided to the environment.
Additionally you need to start celery with at least one process listening to the `scale` queue.

- `PCF_SCALING=<True|False>`

Enable or disable Celery scaling on PCF.

- `PCF_API_URL=https://pcf.api.test/`

A PCF API url to access the hosted app.

- `PCF_USER=PCF.USER`

A PCF User account who has permission to view the apps and run tasks in the org.

- `PCF_PASS=<Secret>`

The password for the PCF_USER.

- `PCF_ORG=My_Org`

The org hosting the PCF application

- `PCF_SPACE=My_Space`

The space hosting the PCF application

- `PCF_APP_NAME=My_App_Name`

The application to run the CELERY_TASKS on when the scale task is executed.  By default this will be the
app that is listening to the scale queue.

- `CELERY_MAX_TASKS_MEMORY=<integer in mb>`

The amount of memory that shouldn't be exceeded when running tasks.  Ideally enough memory should be set to allow all
queues to run at one time, about 10240 with the default settings.

- `CELERY_TASK_APP=<app name>`

If desired, the Celery task application name can be set, otherwise it will default to `application_name`.

- `CELERY_GROUP_NAME=<app name>`

The group name for the scheduled PCF tasks for celery.

```env
CELERY_DEFAULT_TASK_SETTINGS='{ "CELERY_MAX_DEFAULT_TASKS": 3,
                                "CELERY_DEFAULT_DISK_SIZE": 3072,
                                "CELERY_DEFAULT_MEMORY_SIZE": 3072
                              }'
```

A dictionary of settings to use to scale control the sizes and limits on the celery workers.

## CELERY TASKS

- `CELERY_TASKS=<json_object>`

`CELERY_TASKS` is optional. A JSON can be passed in with the following structure.

```json
{ "<queue_name>" : 
  { "command" : "<celery command to call>",
    "disk" : "<An integer disk size to use in mb>",
    "memory" : "<An integer memory size to use in mb>",
    "limit" : "<An integer limit to stop scaling this queue>"
  }
}
```

For example the default looks something like...

```json
{
    "$CELERY_GROUP_NAME": {
        "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n worker@%h -Q $CELERY_GROUP_NAME "
        + priority_queue_command,
        # NOQA
        "disk": 2048,
        "memory": 2048
    },
    "$CELERY_GROUP_NAME.large": {
        "command": "celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n large@%h -Q $CELERY_GROUP_NAME.large "  # NOQA
        + priority_queue_command,
        # NOQA
        "disk": 2048,
        "memory": 4096
    },
    "celery": {
        "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery "
        + priority_queue_command,
        "disk": 2048,
        "memory": 2048,
        "limit": 6
    },
    "$CELERY_GROUP_NAME.priority": {
        "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n priority@%h -Q $CELERY_GROUP_NAME.priority",  # NOQA
        # NOQA
        "disk": 2048,
        "memory": 2048,
        "limit": 2
    }
}
```

The `disk` and `memory` values can be set globally, instead of having to set them for each task.

```env
CELERY_TASK_DISK=<disk_size_in_MB>
CELERY_TASK_MEMORY=<memory_in_MB>
```

If the `memory` and `disk` values are not passed in as part of the JSON object described above, and  `CELERY_TASK_DISK` and `CELERY_TASK_MEMORY` are not set, then the default value of `2048` will be used for both.
