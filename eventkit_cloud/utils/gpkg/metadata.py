from eventkit_cloud.utils.gpkg.sqlite_utils import SQL, Table
from eventkit_cloud.utils.gpkg.tables import (
    ExtensionEntry,
    MetadataEntry,
    MetadataReferenceEntry,
    TableNames,
)


class Metadata(object):
    @staticmethod
    def extension_template():
        return ExtensionEntry(
            table_name=TableNames.GPKG_METADATA,
            column_name=None,
            scope=ExtensionEntry.READ_WRITE_SCOPE,
            definition="http://www.geopackage.org/spec121/#extension_metadata",
            extension_name="gpkg_metadata",
        )

    @staticmethod
    def reference_template():
        return MetadataReferenceEntry(
            reference_scope="geopackage",
            table_name=None,
            column_name=None,
            row_id_value=None,
            md_file_id=1,
            md_parent_id=None,
            timestamp=SQL("""strftime('%Y-%m-%dT%H:%M:%fZ','now')"""),
        )

    @staticmethod
    def reference_extension_template():
        return ExtensionEntry(
            table_name=TableNames.GPKG_METADATA_REFERENCE,
            column_name=None,
            scope=ExtensionEntry.READ_WRITE_SCOPE,
            definition="http://www.geopackage.org/spec121/#extension_metadata",
            extension_name="gpkg_metadata",
        )

    @staticmethod
    def nsg_entry_template(**kwargs):
        return MetadataEntry(
            md_scope="series",
            md_standard_uri="http://metadata.ces.mil/dse/ns/GSIP/nmis/2.2.0/doc",
            mime_type="text/xml",
            **kwargs,
        )

    @staticmethod
    def insert_or_update_metadata_row(cursor, metadata):
        """
        Inserts or updates the metadata entry into gpkg_metadata table.

        :param cursor: the cursor to the GeoPackage database's connection
        :param metadata:  The Metadata entry to insert into the gpkg_metadata table
        """

        if not Table.exists(cursor=cursor, table_name=TableNames.GPKG_METADATA):
            Metadata.create_metadata_table(cursor=cursor)

        columns = metadata.to_dict()
        Table(cursor=cursor, table_name=TableNames.GPKG_METADATA).insert_or_update_row(
            set_columns=columns, where_columns=dict(id=metadata["id"])
        )

        set_columns = Metadata.reference_template().to_dict()
        where_columns = Metadata.reference_template().to_dict()
        del where_columns["timestamp"]
        Table(cursor=cursor, table_name=TableNames.GPKG_METADATA_REFERENCE).insert_or_update_row(
            set_columns=set_columns, where_columns=where_columns
        )

    @staticmethod
    def get_all_metadata(cursor):
        """
        Returns all the rows in the gpkg_metadata table

        :param cursor: the cursor to the GeoPackage database's connection
        :return all the rows in the gpkg_metadata table
        """
        Table.validate_table(cursor, MetadataEntry.NAME, MetadataEntry.COLUMNS)

        # select all the rows
        Table(cursor, table_name=TableNames.GPKG_METADATA).select().execute()
        rows = cursor.fetchall()

        # get the results
        return [MetadataEntry.from_row(_row) for _row in rows]

    @staticmethod
    def create_metadata_table(cursor):
        """
        Creates the gpkg_metadata table and registers the table as an extension to the GeoPackage
        see http://www.geopackage.org/spec121/#metadata_table_table_definition

        :param cursor: the cursor to the GeoPackage database's connection
        """
        from eventkit_cloud.utils.gpkg.extensions import Extension

        # create the metadata table
        cursor.execute(
            f"""
                          CREATE TABLE IF NOT EXISTS {TableNames.GPKG_METADATA}
                          (id              INTEGER CONSTRAINT m_pk PRIMARY KEY ASC NOT NULL UNIQUE,
                           md_scope        TEXT                                    NOT NULL DEFAULT 'dataset',
                           md_standard_uri TEXT                                    NOT NULL,
                           mime_type       TEXT                                    NOT NULL DEFAULT 'text/xml',
                           metadata        TEXT                                    NOT NULL DEFAULT ''
                          );
                        """
        )
        # register extension in the extensions table
        Extension.ensure_extension(cursor, Metadata.extension_template())

    @staticmethod
    def create_metadata_reference_table(cursor):
        """
        Creates the gpkg_metadata table and registers the table as an extension to the GeoPackage
        see http://www.geopackage.org/spec121/#metadata_table_table_definition

        :param cursor: the cursor to the GeoPackage database's connection
        """
        from eventkit_cloud.utils.gpkg.extensions import Extension

        # create the metadata table
        cursor.execute(
            f"""
                         CREATE TABLE IF NOT EXISTS {TableNames.GPKG_METADATA_REFERENCE}
                                      (reference_scope TEXT     NOT NULL,
                                       table_name      TEXT,
                                       column_name     TEXT,
                                       row_id_value    INTEGER,
                                       timestamp       DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                                       md_file_id      INTEGER  NOT NULL,
                                       md_parent_id    INTEGER,
                          CONSTRAINT crmr_mfi_fk FOREIGN KEY (md_file_id) REFERENCES gpkg_metadata(id),
                          CONSTRAINT crmr_mpi_fk FOREIGN KEY (md_parent_id) REFERENCES gpkg_metadata(id));
                       """
        )

        # register extension in the extensions table
        Extension.ensure_extension(cursor, Metadata.reference_extension_template())

    @staticmethod
    def ensure_metadata_tables(cursor):
        """Within the specified cursor connection, try to add all needed MD tables if not present."""
        Metadata.create_metadata_table(cursor=cursor)
        Metadata.create_metadata_reference_table(cursor=cursor)
