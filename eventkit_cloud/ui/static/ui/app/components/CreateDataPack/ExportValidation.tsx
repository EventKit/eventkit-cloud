import * as React from 'react';
import {useJobValidationContext} from "./context/JobValidation";
import {useEffectOnMount} from "../../utils/hooks/hooks";
import {useEffect} from "react";
import {arrayHasValue} from "../../utils/generic";
import {Props as Step2Props} from "./ExportInfo";
import {Props as Step1Props} from "./ExportAOI";


export function Step1Validator(props: Step1Props) {
    const {setNextEnabled, setNextDisabled, nextEnabled} = props;
    const {aoiHasArea} = useJobValidationContext();

    useEffectOnMount(() => {
        setNextDisabled();
    });

    // Simply needs the AOI to be set.
    useEffect(() => {
        const setEnabled = aoiHasArea;
        if (setEnabled && !nextEnabled) {
            setNextEnabled();
        } else if (!setEnabled && nextEnabled) {
            setNextDisabled();
        }
    });

    return null;
}


export function hasRequiredFields(exportInfo: Eventkit.Store.ExportInfo) {
    // if the required fields are populated return true, else return false
    const {exportOptions} = exportInfo;
    const formatsAreSelected = exportInfo.providers.map((provider) => {
        return !!exportOptions[provider.slug]
            && exportOptions[provider.slug].formats
            && exportOptions[provider.slug].formats.length > 0;
    });

    const getIsStringValid = (value: string) => !!value && value.trim() !== "";
    return !!(
        getIsStringValid(exportInfo.exportName)
        && getIsStringValid(exportInfo.datapackDescription)
        && getIsStringValid(exportInfo.projectName)
        && exportInfo.providers.length > 0
        && exportInfo.projections.length > 0
        && formatsAreSelected.every(selected => selected)
    );
}

export function hasDisallowedSelection(exportInfo: Eventkit.Store.ExportInfo) {
    // if any unacceptable providers are selected return true, else return false
    return exportInfo.providers.some((provider) => {
        // short-circuiting means that this shouldn't be called until provider.availability
        // is populated, but if it's not, return false
        const providerInfo = exportInfo.providerInfo[provider.slug];
        if (!providerInfo) {
            return false;
        }
        const {availability} = providerInfo;
        if (availability && availability.status) {
            return availability.status.toUpperCase() === 'FATAL';
        }
        return false;
    });
}

interface ValidationProps extends Step2Props {tourRunning: boolean}

export function Step2Validator(props: ValidationProps) {
    const {tourRunning, setNextEnabled, setNextDisabled, walkthroughClicked, exportInfo, nextEnabled} = props;
    const {aoiHasArea, areEstimatesLoading, dataSizeInfo, aoiArea} = useJobValidationContext();
    const {exceedingSize = [], noMaxDataSize = []} = dataSizeInfo || {};

    useEffectOnMount(() => {
        setNextDisabled();
    });

    useEffect(() => {
        const validState = hasRequiredFields(exportInfo) && !hasDisallowedSelection(exportInfo);
        const providersValid = exportInfo.providers.every(provider => {
            // If the AOI is exceeded, check to see if the data size is exceeded.
            if (aoiArea > parseFloat(provider.max_selection)) {
                if (arrayHasValue(noMaxDataSize, provider.slug)) {
                    return false;
                }
                // The AOI is exceeded, and data size can be used.
                // Estimates can't be currently loading, and the provider must not be exceeding its data size
                return !areEstimatesLoading && !arrayHasValue(exceedingSize, provider.slug);
            }
            return true;
        });
        // We don't want to control this while the page tour is running
        if (!tourRunning) {
            const setEnabled = !walkthroughClicked && aoiHasArea && validState && providersValid;
            if (setEnabled && !nextEnabled) {
                setNextEnabled();
            } else if (!setEnabled && nextEnabled) {
                setNextDisabled();
            }
        }
    });

    return null;
}