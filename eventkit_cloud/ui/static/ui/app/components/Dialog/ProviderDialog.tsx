
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, StyledComponentProps } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import Progress from '@material-ui/core/CircularProgress';
import BaseDialog from '../Dialog/BaseDialog';
import DropDownListItem from '../common/DropDownListItem';
import { getProviderTask } from '../../actions/providerActions';
import { getJobDetails } from "../../utils/generic"

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

export class ProviderDialog extends React.Component<Props, State> {
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
        this.setState({ loading: false });
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
            height: '75px' ,
        };

        return (
            <BaseDialog
                className="qa-DataPackGridItem-BaseDialog"
                show={this.props.open}
                title="DATA SOURCES"
                onClose={this.props.onClose}
            >
                {this.state.loading ?
                    <div style={loadingStyle}>
                        <Progress size={50} />
                    </div>
                :
                    <List>
                        {this.props.uids.map((uid, ix) => {
                            const providerTask = this.props.providerTasks[uid];
                            if (!providerTask) {
                                return;
                            }
                            const provider = this.props.providers.find(p => p.slug === providerTask.slug);
                            if (!provider) {
                                return;
                            }

                            const { job } = this.state
                            const dataProviderTask = job && job.provider_tasks.find(obj => obj.provider === provider.name)

                            // If available, get custom zoom levels from DataProviderTask otherwise use Provider defaults.
                            const minZoom = dataProviderTask && dataProviderTask.min_zoom || provider && provider.level_from
                            const maxZoom = dataProviderTask && dataProviderTask.max_zoom || provider && provider.level_to

                            return (
                                <DropDownListItem
                                    title={provider.name}
                                    key={provider.slug}
                                    alt={ix % 2 !== 0}
                                >
                                    <div>Zoom Levels {minZoom} - {maxZoom}</div>
                                    <div>{provider.service_description}</div>
                                </DropDownListItem>
                            );
                        })}
                    </List>
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

export default
    withTheme()(
        connect(mapStateToProps, mapDispatchToProps)(ProviderDialog));
