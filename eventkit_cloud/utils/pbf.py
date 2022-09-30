# -*- coding: utf-8 -*-


import argparse
import logging
import os
import subprocess
from string import Template
from typing import Optional

from django.conf import settings

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


class OSMToPBF(object):
    """
    Convert OSM to PBF.
    """

    def __init__(
        self, osm_files: Optional[list[str]] = None, outfile: str = None, debug: bool = False, task_uid: str = None
    ):
        """
        Initialize the OSMToPBF utility.

        Args:
            osm_files: the raw osm file to convert
            outfile: the location of the pbf output file
        """

        if not osm_files or any(not os.path.exists(osm) for osm in osm_files):
            raise IOError("Cannot find raw OSM data for this task.")
        self.outfile = outfile
        if not self.outfile:
            # create pbf path from osm path.
            root = osm_files[0].split(".")[0]
            self.outfile = root + ".pbf"
        self.osm: str = " ".join(osm_files)
        self.debug = debug
        self.cmd = Template("osmconvert $osm --hash-memory=$hash_memory -o=$pbf")
        self.task_uid = task_uid
        try:
            os.remove(self.outfile)
        except Exception:
            pass

    def convert(self):
        """
        Convert the raw osm to pbf.
        """
        convert_cmd = self.cmd.safe_substitute(
            {"osm": self.osm, "hash_memory": settings.OSM_MAX_TMPFILE_SIZE, "pbf": self.outfile}
        )
        if self.debug:
            print("Running: %s" % convert_cmd)
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable="/bin/bash", stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error("{0}".format(task_process.stderr))
            logger.error("osmconvert failed with return code: {0}".format(task_process.exitcode))
            logger.error("osmconvert most commonly fails due to lack of memory.")
            raise Exception("Osmconvert Failed.")

        if self.debug:
            print("Osmconvert returned: %s" % task_process.exitcode)
        return self.outfile


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Converts OSM XML to PBF")
    parser.add_argument("-o", "--osm-file", required=True, dest="osm", help="The OSM file to convert")
    parser.add_argument("-p", "--pbf-file", required=True, dest="pbf", help="The PBF file to write to")
    parser.add_argument("-d", "--debug", action="store_true", help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in list(vars(args).items()):
        if v is None:
            continue
        else:
            config[k] = v
    osm = config["osm"]
    pbf = config["pbf"]
    debug = False
    if config.get("debug"):
        debug = True
    o2p = OSMToPBF(osm_files=[osm], outfile=pbf, debug=debug)
    o2p.convert()
