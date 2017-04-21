import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';

export function orderAZ(runs) {
    return sortBy(runs, (o) => {
        return o.job.name.toUpperCase();
    });
};

export function orderZA(runs) {
    return sortBy(runs, (o) => {
        return o.job.name.toUpperCase();
    }).reverse();
};

export function orderEventAZ(runs) {
    return sortBy(runs, (o) => {
        return o.job.event.toUpperCase();
    });
};

export function orderEventZA(runs) {
    return sortBy(runs, (o) => {
        return o.job.event.toUpperCase();
    }).reverse();
};

export function orderOldest(runs) {
    return sortBy(runs, (o) => {
        return o.started_at;
    });
};

export function orderNewest(runs) {
    return sortBy(runs, (o) => {
        return o.started_at;
    }).reverse();
};

export function orderComplete(runs) {
    return sortBy(runs, (o) => {
        return o.status
    });
};

export function orderIncomplete(runs) {
    return sortBy(runs, (o) => {
        return o.status
    }).reverse();
};

export function orderPrivate(runs) {
    return sortBy(runs, (o) => {
        return o.job.published
    });
};

export function orderPublic(runs) {
    return sortBy(runs, (o) => {
        return o.job.published
    }).reverse();
};

export function orderOwnerAZ(runs) {
    return sortBy(runs, (o) => {
        return o.user
    });
};

export function orderOwnerZA(runs) {
    return sortBy(runs, (o) => {
        return o.user
    }).reverse();
};

export function myDataPacksOnly(runs, username) {
    const myDataPacks = filter(runs, (o) => {
        return o.user == username
    });
    return myDataPacks;
};

export function search(searchText, runs) {
    const query = searchText.toUpperCase();
    let searched = filter(runs, function(o) {
        if(o.job.name.toUpperCase().includes(query)) { return true}
        if(o.job.description.toUpperCase().includes(query)) {return true}
        if(o.job.event.toUpperCase().includes(query)) {return true}
    });
    return searched;
};

export function filterPermissions(permission, runs) {
    if(permission.toUpperCase() == 'PRIVATE'){
        return filter(runs, function(o) {
            return !o.job.published;
        });
    }
    else {
        return filter(runs, function(o) {
            return o.job.published
        });
    }
};

export function filterStatus(status, runs) {
    return filter(runs, function(o) {
        if(status.completed && o.status == 'COMPLETED') {
            return true;
        }
        if(status.incomplete && o.status == 'INCOMPLETE') {
            return true;
        }
        if(status.running && o.status == 'SUBMITTED') {
            return true;
        }
        return false;
    });
};

export function filterDate(minDate, maxDate, runs) {
    if(minDate) {
        runs = filter(runs, function(o) {
            return o.started_at >= minDate.toISOString();
        });
    }
    if(maxDate) {
        runs = filter(runs, function(o) {
            let started = new Date(o.started_at).setHours(0,0,0,0);
            return started <= maxDate;
        });
    }
    return runs;
}

