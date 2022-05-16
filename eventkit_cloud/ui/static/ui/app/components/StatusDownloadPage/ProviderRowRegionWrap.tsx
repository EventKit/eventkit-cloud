import RegionJustification from "./RegionJustification";
import ProviderRow, {ProviderRowProps} from "./ProviderRow";
import {useState} from "react";

// Copy the interface but ignore properties that come from HOC like MUI withWidth ('width')
// Also ignore 'restricted' and 'openDialog' as we supply that here
interface Props extends Omit<ProviderRowProps,
    'theme' |
    'width' |
    'classes' |
    'restricted' |
    'openDialog'> {
    extents: any[],
}

export function ProviderRowRegionWrap(props: Props) {
    const {extents, ...passThroughProps} = props;

    const [open, setOpen] = useState(false);
    const [providerRestricted, setProviderRestricted] = useState(false);
    return (
        <>
            <RegionJustification
                providers={[props.providerTask.provider]}
                extents={extents}
                onClose={() => {
                        setProviderRestricted(true);
                        setOpen(false);
                    }
                }
                onBlockSignal={() => setProviderRestricted(true)}
                onUnblockSignal={() => setProviderRestricted(false)}
                display={open}
            />
            <ProviderRow
                {...{
                    restricted: providerRestricted,
                    openDialog: () => setOpen(true),
                    ...passThroughProps
                }}
            />
        </>
    )

}