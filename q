                                             Table "public.jobs"
        Column        |               Type                |                     Modifiers                     
----------------------+-----------------------------------+---------------------------------------------------
 created_at           | timestamp with time zone          | not null
 updated_at           | timestamp with time zone          | not null
 id                   | integer                           | not null default nextval('jobs_id_seq'::regclass)
 uid                  | uuid                              | not null
 name                 | character varying(100)            | not null
 description          | character varying(1000)           | not null
 event                | character varying(100)            | not null
 published            | boolean                           | not null
 featured             | boolean                           | not null
 the_geom             | geometry(MultiPolygon,4326)       | not null
 the_geom_webmercator | geometry(MultiPolygon,3857)       | not null
 the_geog             | geography(MultiPolygon,4326)      | not null
 region_id            | integer                           | 
 user_id              | integer                           | not null
 include_zipfile      | boolean                           | not null
 json_tags            | jsonb                             | not null
 preset_id            | integer                           | 
 original_selection   | geometry(GeometryCollection,4326) | 
 visibility           | character varying(10)             | not null
Indexes:
    "jobs_pkey" PRIMARY KEY, btree (id)
    "jobs_uid_key" UNIQUE CONSTRAINT, btree (uid)
    "jobs_0f442f96" btree (region_id)
    "jobs_41196390" btree (event)
    "jobs_611231c9" btree (featured)
    "jobs_67daf92c" btree (description)
    "jobs_8f888fed" btree (published)
    "jobs_b068931c" btree (name)
    "jobs_cf933d7f" btree (preset_id)
    "jobs_description_15ddf24c_like" btree (description varchar_pattern_ops)
    "jobs_e8701ad4" btree (user_id)
    "jobs_event_1b5a9243_like" btree (event varchar_pattern_ops)
    "jobs_name_698afa2a_like" btree (name varchar_pattern_ops)
    "jobs_original_selection_id" gist (original_selection)
    "jobs_the_geog_id" gist (the_geog)
    "jobs_the_geom_id" gist (the_geom)
    "jobs_the_geom_webmercator_id" gist (the_geom_webmercator)
Foreign-key constraints:
    "jobs_preset_id_8a8629fb_fk_datamodel_preset_id" FOREIGN KEY (preset_id) REFERENCES datamodel_preset(id) DEFERRABLE INITIALLY DEFERRED
    "jobs_region_id_535c795f_fk_regions_id" FOREIGN KEY (region_id) REFERENCES regions(id) DEFERRABLE INITIALLY DEFERRED
    "jobs_user_id_4ba01a1d_fk_auth_user_id" FOREIGN KEY (user_id) REFERENCES auth_user(id) DEFERRABLE INITIALLY DEFERRED
Referenced by:
    TABLE "core_jobpermission" CONSTRAINT "core_jobpermission_job_id_c32631fe_fk_jobs_id" FOREIGN KEY (job_id) REFERENCES jobs(id) DEFERRABLE INITIALLY DEFERRED
    TABLE "export_runs" CONSTRAINT "export_runs_job_id_38b6a003_fk_jobs_id" FOREIGN KEY (job_id) REFERENCES jobs(id) DEFERRABLE INITIALLY DEFERRED
    TABLE "jobs_provider_tasks" CONSTRAINT "jobs_provider_tasks_job_id_67ccd885_fk_jobs_id" FOREIGN KEY (job_id) REFERENCES jobs(id) DEFERRABLE INITIALLY DEFERRED

