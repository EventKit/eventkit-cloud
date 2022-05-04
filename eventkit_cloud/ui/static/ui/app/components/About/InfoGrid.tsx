import { Component } from 'react';
import ImageList from '@mui/material/ImageList';
import GridTile from '@mui/material/ImageListItem';

export interface Props {
    title: any;
    items: Array<{
        title: string;
        body: string;
    }>;
    titleStyle?: object;
    itemStyle?: object;
}

export class InfoGrid extends Component<Props, {}> {
    render() {
        const styles = {
            title: {
                textAlign: 'center' as 'center',
                ...this.props.titleStyle,
            },
            item: {
                wordWrap: 'break-word' as 'break-word',
                ...this.props.itemStyle,
            },
        };

        return (
            <div>
                <h3 style={styles.title}><strong>{this.props.title}</strong></h3>
                <ImageList rowHeight="auto" gap={12}>
                    {this.props.items.map(item => (
                        <GridTile
                            key={item.title}
                            style={styles.item}
                        >
                            <strong>{item.title}:&nbsp;</strong>
                            <span>{item.body}</span>
                        </GridTile>
                    ))}
                </ImageList>
            </div>
        );
    }
}

export default InfoGrid;
