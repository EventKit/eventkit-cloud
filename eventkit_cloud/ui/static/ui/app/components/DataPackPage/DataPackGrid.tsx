import * as React from 'react';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import GridList from '@material-ui/core/GridList';
import DataPackGridItem from './DataPackGridItem';
import CustomScrollbar from '../CustomScrollbar';
import LoadButtons from '../common/LoadButtons';
import withRef from '../../utils/withRef';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

export interface Props {
    customRef?: any;
    runIds: string[];
    user: Eventkit.Store.User;
    onRunDelete: () => void;
    onRunShare: () => void;
    providers: Eventkit.Provider[];
    range: string;
    handleLoadLess: () => void;
    handleLoadMore: () => void;
    loadLessDisabled: boolean;
    loadMoreDisabled: boolean;
    name: string;
    width: Breakpoint;
}

export class DataPackGrid extends React.Component<Props, {}> {
    private scrollbar: CustomScrollbar;

    private getColumns() {
        if (!isWidthUp('md', this.props.width)) {
            return 2;
        } else if (isWidthUp('xl', this.props.width)) {
            return 4;
        }
        return 3;
    }

    public getScrollbar() {
        return this.scrollbar;
    }

    render() {
        const spacing = isWidthUp('sm', this.props.width) ? '10px' : '2px';
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap' as 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            gridList: {
                border: '1px',
                width: '100%',
                margin: '0px',
                height: 'auto',
            },
        };

        return (
            <CustomScrollbar
                ref={(instance) => { this.scrollbar = instance; }}
                style={{ height: 'calc(100vh - 236px)', width: '100%' }}
            >
                <div style={styles.root} className="qa-div-root">
                    <GridList
                        className="qa-DataPackGrid-GridList"
                        cellHeight="auto"
                        style={styles.gridList}
                        spacing={isWidthUp('md', this.props.width) ? 7 : 2}
                        cols={this.getColumns()}
                    >
                        {this.props.runIds.map((id, index) => (
                            <DataPackGridItem
                                className="qa-DataPackGrid-GridListItem"
                                runId={id}
                                userData={this.props.user.data}
                                key={id}
                                onRunDelete={this.props.onRunDelete}
                                onRunShare={this.props.onRunShare}
                                providers={this.props.providers}
                                gridName={this.props.name}
                                index={index}
                                showFeaturedFlag
                            />
                        ))}
                    </GridList>
                </div>
                <LoadButtons
                    range={this.props.range}
                    handleLoadLess={this.props.handleLoadLess}
                    handleLoadMore={this.props.handleLoadMore}
                    loadLessDisabled={this.props.loadLessDisabled}
                    loadMoreDisabled={this.props.loadMoreDisabled}
                />
            </CustomScrollbar>
        );
    }
}

export default withWidth()(withRef()(DataPackGrid));
