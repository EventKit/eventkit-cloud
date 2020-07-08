import { normalize, schema } from 'normalizr';

export default class Normalizer {
    private idOption: object;
    private job: schema.Entity;
    private task: schema.Entity;
    // tslint:disable-next-line
    private provider_task: schema.Entity;
    // tslint:disable-next-line
    private provider_tasks: schema.Array;
    private run: schema.Entity;
    private runs: schema.Array;
    private user: schema.Entity;
    private userData: schema.Entity;

    public constructor() {
        this.idOption = { idAttribute: 'uid' };

        // run schemas
        this.job = new schema.Entity('jobs', {}, this.idOption);
        this.task = new schema.Entity('tasks', {}, this.idOption);
        this.provider_task = new schema.Entity('provider_tasks', { tasks: new schema.Array(this.task) }, this.idOption);
        this.provider_tasks = new schema.Array(this.provider_task);
        this.run = new schema.Entity('runs', { job: this.job, provider_tasks: this.provider_tasks }, this.idOption);
        this.runs = new schema.Array(this.run);
    }

    public normalizeRun(run) {
        return normalize(run, this.run);
    }
}
