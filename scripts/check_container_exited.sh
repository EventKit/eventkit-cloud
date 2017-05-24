#!/bin/bash
ContainerName=$1
ExpectedExitStatus=$2

StatusLine=$(docker-compose ps $ContainerName | tail -n1)
ContainerState=$(echo $StatusLine | awk '{print $5}')
ExitStatus=$(echo $StatusLine | awk '{print $6}')

if [[ $ContainerState == "Exit" && $ExitStatus == "0" ]]; then
    echo $ContainerName exited cleanly
    exit 0
else
    echo $ContainerName did not exit cleanly, state: $ContainerState, exit status: $ExitStatus
    exit 1
fi

