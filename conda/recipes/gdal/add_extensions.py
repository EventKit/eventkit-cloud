import requests
import subprocess
import os
import logging

logging.basicConfig()

logger = logging.getLogger(__file__)


logger.error("***Adding additional extensions...***")
dsdk_file = "MrSID_DSDK-9.5.4.4709-rhel6.x86-64.gcc531"
ogdi_file = "ogdi-4.1.0"
files = [("{}.tar.gz".format(dsdk_file), "https://bin.extensis.com/download/developer/{}.tar.gz".format(dsdk_file)),
         ("{}.tar.gz".format(ogdi_file), "https://sourceforge.net/projects/ogdi/files/{}/{}.tar.gz/download".format('/'.join(ogdi_file.split('-'), ogdi_file)))]

files = [("{}.tar.gz".format(dsdk_file), "https://bin.extensis.com/download/developer/{}.tar.gz".format(dsdk_file)),
         ("{}.tar.gz".format(ogdi_file), "https://sourceforge.net/projects/ogdi/files/{}/{}.tar.gz/download".format('/'.join(ogdi_file.split('-'), ogdi_file)))]


def download_and_extract_files(files):
    for file_name, url in files:
        file_path = os.path.join(os.getenv("PREFIX", ""), "{}.tar.gz".format(file_name))
        if not os.path.isfile(file_path):
            response = requests.get(url, allow_redirects=True, stream=True)

            logger.info("Downloading %s to %s", (url, file_path))
            with open(file_path, "wb") as open_file:
                for chunk in response.iter_content(2048):
                    open_file.write(chunk)

        logger.info("Extracting %s", (file_path, ))
        subprocess.call(f"tar -zxvf {file_path}", shell=True)

os.environ["OPTS"] = "--with-ogdi=${{PREFIX}}/{1}".format(ogdi_file)

# OPTS = "--with-mrsid=${{PREFIX}}/{0}/Raster_DSDK --with-mrsid_lidar=${{PREFIX}}/{0}/Lidar_DSDK --with-ogdi=${{PREFIX}}/{1}".format(dsdk_file, ogdi_file)

