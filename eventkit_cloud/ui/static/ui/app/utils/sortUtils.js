import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';

export function orderAZ(runs) {
    return sortBy(runs, (o) => {
        return o.job.name.toUpperCase();
    });
}

export function orderZA(runs) {
    return sortBy(runs, (o) => {
        return o.job.name.toUpperCase();
    }).reverse();
}

export function orderOldest(runs) {
    return sortBy(runs, (o) => {
        return o.started_at;
    });
}

export function orderNewest(runs) {
    return sortBy(runs, (o) => {
        return o.started_at;
    }).reverse();
}

export function myDataPacksOnly(runs, username) {
    const myDataPacks = filter(runs, (o) => {
        return o.user == username
    });
    return myDataPacks;
}

export function search(searchText, runs) {
    const query = searchText.toUpperCase();
    let searched = filter(runs, function(o) {
        if(o.job.name.toUpperCase().includes(query)) { return true}
        if(o.job.description.toUpperCase().includes(query)) {return true}
        if(o.job.event.toUpperCase().includes(query)) {return true}
    });
    return searched;
}
