import { Component } from 'react';
import {connect} from 'react-redux';
import {withTheme, StyledComponentProps} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import Progress from '@material-ui/core/CircularProgress';
import BaseDialog from './BaseDialog';
import DropDownListItem from '../common/DropDownListItem';
import {getProviderTask} from '../../actions/providerActions';
import {getJobDetails, getProviderFromProviderTask, shouldDisplay} from "../../utils/generic"

interface OwnProps {
    uids: string[];
    open: boolean;
    providers: Eventkit.Provider[];
    onClose: () => void;
}

interface State {
    loading: boolean;
    job: Eventkit.Job;
}

interface StateProps {
    providerTasks: Eventkit.ProviderTask[];
    jobuid: string;
}

interface DispatchProps {
    getProviderTask: (uid: string) => void;
}

type Props = StyledComponentProps & StateProps & DispatchProps & OwnProps;

export class ProviderDialog extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            job: null,
        };
    }

    componentDidMount() {
        if (this.props.open) {
            this.getProviders(this.props.uids);
        }
        getJobDetails(this.props.jobuid).then(data => {
            this.setState({
                job: data
            })
        })
    }

    componentDidUpdate(prevProps) {
        if (this.props.open && !prevProps.open) {
            this.getProviders(this.props.uids);
        }
    }

    private async getProviders(uids: string[]) {
        this.setState({
            loading: true,
        });

        const promises = [];
        uids.forEach(uid => {
            const ret = this.props.getProviderTask(uid);
            promises.push(ret);
        });

        await Promise.all(promises);
        this.setState({loading: false});
    }

    render() {
        if (!this.props.open) {
            return null;
        }

        const loadingStyle = {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '75px',
        };
        const someSourcesHiddenMsg = "Some sources are unavailable due to user permissions. If you believe this is an error, please contact your administrator.";
        const allSourcesHiddenMsg = "All data sources are unavailable due to user permissions. If you believe this is an error, please contact your administrator.";
        const providers = [];
        (Object.values(this.props.providerTasks) || []).map(
            providerTask => {
                if(shouldDisplay(providerTask)) {
                    const provider = getProviderFromProviderTask(providerTask, this.props.providers);
                    // Realistically, we shouldn't ever even be checking to see if we should display a hidden provider,
                    // as the provider task itself should already be hidden, but gaps might exist.
                    if (!!provider && shouldDisplay(provider)) {
                        providers.push(provider);
                    }
                }
            }
        );
        return (
            <BaseDialog
                className="qa-DataPackGridItem-BaseDialog"
                show={this.props.open}
                title="DATA SOURCES"
                onClose={this.props.onClose}
            >
                {this.state.loading ?
                    <div style={loadingStyle}>
                        <Progress size={50}/>
                    </div>
                    :
                    (<>
                            {this.state.job && this.state.job.provider_task_list_status === 'EMPTY' &&
                            (<div>{allSourcesHiddenMsg}</div>)
                            }
                            {this.state.job && this.state.job.provider_task_list_status === 'PARTIAL' &&
                            (<div>{someSourcesHiddenMsg}</div>)
                            }
                            <List>
                                {providers.map((provider, ix) => {
                                    const {job} = this.state;
                                    const dataProviderTask = job && job.provider_tasks.find(obj => obj.provider === provider.name)

                                    // If available, get custom zoom levels from DataProviderTask otherwise use Provider defaults.
                                    const min_zoom = dataProviderTask && dataProviderTask.min_zoom || provider && provider.level_from
                                    const max_zoom = dataProviderTask && dataProviderTask.max_zoom || provider && provider.level_to

                                    return (

                                        <DropDownListItem
                                            title={provider.name}
                                            key={provider.slug}
                                            alt={ix % 2 !== 0}
                                        >
                                            <div>Zoom Levels {min_zoom} - {max_zoom}</div>
                                            <div>{provider.service_description}</div>
                                        </DropDownListItem>
                                    );
                                })}
                            </List>
                        </>
                    )
                }
            </BaseDialog>
        );
    }
}

const mapStateToProps = (state) => (
    {
        providerTasks: state.providerTasks.data,
    }
);

const mapDispatchToProps = (dispatch) => (
    {
        getProviderTask: (uid) => (
            dispatch(getProviderTask(uid))
        ),
    }
);

export default withTheme(
    connect(mapStateToProps, mapDispatchToProps)(ProviderDialog));
