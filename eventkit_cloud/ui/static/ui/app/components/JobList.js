
import React, {PropTypes} from 'react';

const JobList = ({jobs}) => {
    return (
        <ul className="list-group">
            {jobs.map(job =>
                <li className="list-group-item" key={job.uid}>
                    {job.name}
                </li>
            )}
        </ul>
    );
};

JobList.propTypes = {
    jobs: PropTypes.array.isRequired
};

export default JobList;