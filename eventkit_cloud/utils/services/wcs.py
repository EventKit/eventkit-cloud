from __future__ import annotations
import re
import logging
from typing import Union, List

from eventkit_cloud.utils.services.errors import MissingLayerError, UnsupportedFormatError
from eventkit_cloud.utils.services.ows import OWS
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from eventkit_cloud.utils.services.provider_check import CheckResult


logger = logging.getLogger(__name__)


class WCS(OWS):
    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WCS"

    def find_layer(self, root) -> Union[CheckResult, List[str]]:
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """

        content_meta = root.find(".//contentmetadata")
        if content_meta is None:
            raise UnsupportedFormatError()

        # Get names of available coverages
        coverage_offers = content_meta.findall("coverageofferingbrief")

        cover_names = [(c, c.find("name")) for c in coverage_offers]
        if not cover_names:  # No coverages are offered
            raise MissingLayerError()

        try:
            coverages = self.config.get("service", dict()).get("coverages")
            coverages = coverages.split(",") if coverages else None
            coverages = list(map(str.lower, coverages)) if coverages else None
        except AttributeError:
            logger.error("Unable to get coverages from WCS provider configuration.")

        if coverages:
            covers = [c for c, n in cover_names if n is not None and n.text in coverages]
        else:
            covers = [c for c, n in cover_names if n is not None and self.layer == n.text]

        if not covers:  # Requested coverage is not offered
            raise MissingLayerError()

        return covers

    def get_bbox(self, elements):
        bboxes = []
        for element in elements:
            envelope = element.find("lonlatenvelope")
            if envelope is None:
                continue

            pos = list(envelope)
            # Make sure there aren't any surprises
            coord_pattern = re.compile(r"^-?\d+(\.\d+)? -?\d+(\.\d+)?$")
            if not pos or not all("pos" in p.tag and re.match(coord_pattern, p.text) for p in pos):
                continue

            x1, y1 = list(map(float, pos[0].text.split(" ")))
            x2, y2 = list(map(float, pos[1].text.split(" ")))

            minx, maxx = sorted([x1, x2])
            miny, maxy = sorted([y1, y2])

            bboxes.append([minx, miny, maxx, maxy])
        return bboxes if bboxes else None

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")
