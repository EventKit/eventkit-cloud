import { normalize, schema } from 'normalizr';

export default class Normalizer {
    private idOption: object;
    private job: schema.Entity;
    private task: schema.Entity;
    private provider_task: schema.Entity;
    private provider_tasks: schema.Array;
    private run: schema.Entity;
    private runs: schema.Array;
    private user: schema.Entity;
    private userLicenses: schema.Entity;
    private groupList: schema.Entity;
    private userGroupList: schema.Array;
    private userData: schema.Entity;
    private fullUser: schema.Entity;

    public constructor() {
        this.idOption = { idAttribute: 'uid' };

        // run schemas
        this.job = new schema.Entity('jobs', {}, this.idOption);
        this.task = new schema.Entity('tasks', {}, this.idOption);
        this.provider_task = new schema.Entity('provider_tasks', { tasks: new schema.Array(this.task) }, this.idOption);
        this.provider_tasks = new schema.Array(this.provider_task);
        this.run = new schema.Entity('runs', { job: this.job, provider_tasks: this.provider_tasks }, this.idOption);
        this.runs = new schema.Array(this.run);

        // user schemas
        this.user = new schema.Entity('user', {}, { idAttribute: 'username'});
        // this.userLicenses = new schema.Entity('accepted_licenses');
        // this.groupList = new schema.Entity('groups');
        // this.userGroupList = new schema.Array(new schema.Entity('group'));
        this.userData = new schema.Entity('user', {
            user: this.user,
        });
        // this.fullUser = new schema.Entity('user', { data: this.userData });

    }

    public getRunSchemas() {
        return {
            job: this.job,
            task: this.task,
            provider_task: this.provider_task,
            provider_tasks: this.provider_tasks,
            run: this.runs,
            runs: this.runs,
        };
    }

    public normalizeRuns(runs) {
        return normalize(runs, this.runs);
    }

    public normalizeRun(run) {
        return normalize(run, this.run);
    }

    public normalizeUserData(user) {
        return normalize(user, this.userData);
    }
};
