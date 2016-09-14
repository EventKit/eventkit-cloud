#!/bin/bash

#LOGFILEPATH=/var/log/eventkit/
LOGFILEPATH="test.log"

inotifywait -mqr -e close_write --format '%w%f' "$1" | while read FILE;
do
	echo "close_write"
	path=$(echo "$FILE" | sed 's:^\.\/::')
	$(s3cmd put $FILE s3://$2/$path > /dev/null)
	now=$(date)
	echo "$now | uploaded $FILE to s3" >> $LOGFILEPATH
done
