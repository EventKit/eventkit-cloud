
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, StyledComponentProps } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import Progress from '@material-ui/core/CircularProgress';
import BaseDialog from '../Dialog/BaseDialog';
import DropDownListItem from '../common/DropDownListItem';
import { getProviderTask } from '../../actions/providerActions';

interface OwnProps {
    uids: string[];
    open: boolean;
    providers: Eventkit.Provider[];
    onClose: () => void;
}

interface State {
    loading: boolean;
}

interface StateProps {
    providerTasks: Eventkit.ProviderTask[];
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
        };
    }

    componentDidMount() {
        if (this.props.open) {
            this.getProviders(this.props.uids);
        }
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
                            return (
                                <DropDownListItem
                                    title={provider.name}
                                    key={provider.slug}
                                    alt={ix % 2 !== 0}
                                >
                                    {provider.service_description}
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
