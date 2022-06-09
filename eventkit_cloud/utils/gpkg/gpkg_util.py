from typing import List

from eventkit_cloud.utils.gpkg.sqlite_utils import Table
from eventkit_cloud.utils.gpkg.tables import LayerEntry


class Geopackage(object):
    @staticmethod
    def get_layers(cursor) -> List[LayerEntry]:
        """
        Returns a list of LayerEntry's built from the contents of the geopackage.

        :param cursor: the cursor to the GeoPackage database's connection
        """
        Table.validate_table(cursor, LayerEntry.NAME, LayerEntry.COLUMNS)

        # select all the rows
        Table(cursor, table_name=LayerEntry.NAME).select().execute()
        rows = cursor.fetchall()

        # get the results
        return [LayerEntry.from_row(_row) for _row in rows]
