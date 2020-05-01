from eventkit_cloud.utils.gpkg.extensions import Extension
from eventkit_cloud.utils.gpkg.sqlite_utils import Table
from eventkit_cloud.utils.gpkg.tables import TableNames, MetadataEntry, ExtensionEntry, MetadataReferenceEntry


class Metadata(object):
    EXTENSION = ExtensionEntry(
        table_name=TableNames.GPKG_METADATA,
        column_name=None,
        scope=ExtensionEntry.READ_WRITE_SCOPE,
        definition='http://www.geopackage.org/spec121/#extension_metadata',
        extension_name='gpkg_metadata'
    )
    REFERENCE = MetadataReferenceEntry(
        reference_scope='geopackage',
        table_name=None,
        column_name=None,
        row_identifier=None,
        file_identifier=1,
        parent_identifier=None

    )

    @staticmethod
    def insert_or_update_metadata_row(cursor,
                                      metadata):
        """
        Inserts or updates the metadata entry into gpkg_metadata table.

        :param cursor: the cursor to the GeoPackage database's connection
        :type cursor: Cursor

        :param metadata:  The Metadata entry to insert into the gpkg_metadata table
        :type metadata: MetadataEntry
        """

        if not Table.exists(cursor=cursor, table_name=TableNames.GPKG_METADATA):
            Metadata.create_metadata_table(cursor=cursor)

        columns = metadata.to_dict()
        Table(
            cursor=cursor, table_name=TableNames.GPKG_METADATA
        ).insert_or_update_row(set_columns=columns, where_columns=columns)

    @staticmethod
    def get_all_metadata(cursor):
        """
        Returns all the rows in the gpkg_metadata table

        :param cursor: the cursor to the GeoPackage database's connection
        :return all the rows in the gpkg_metadata table
        """
        Table.validate_table(cursor, TableNames.GPKG_METADATA, MetadataEntry.COLUMNS)

        # select all the rows
        Table(cursor, TableNames.GPKG_METADATA).select().execute()
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
        # create the metadata table
        cursor.execute("""
                          CREATE TABLE IF NOT EXISTS {table_name}
                          (id              INTEGER CONSTRAINT m_pk PRIMARY KEY ASC NOT NULL UNIQUE,             -- Primary key for the meta data entry
                           md_scope        TEXT                                    NOT NULL DEFAULT 'dataset',  -- Case sensitive name of the data scope
                           md_standard_uri TEXT                                    NOT NULL,                    -- URI reference to the metadata authority
                           mime_type       TEXT                                    NOT NULL DEFAULT 'text/xml', -- MIME encoding of metadata
                           metadata        TEXT                                    NOT NULL DEFAULT ''          -- metadata document
                          );
                        """.format(table_name=TableNames.GPKG_METADATA))

        # # register extension in the extensions table
        if not Extension.has_extension(cursor=cursor,
                                       extension=Metadata.EXTENSION):
            Extension.add_extension(cursor=cursor,
                                    extension=Metadata.EXTENSION)

    @staticmethod
    def create_metadata_reference_table(cursor):
        """
        Creates the gpkg_metadata table and registers the table as an extension to the GeoPackage
        see http://www.geopackage.org/spec121/#metadata_table_table_definition

        :param cursor: the cursor to the GeoPackage database's connection
        """
        # create the metadata table
        cursor.execute(f"""
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
                       """)

        # register extension in the extensions table
        if not Extension.has_extension(cursor=cursor,
                                       extension=Metadata.REFERENCE):
            Extension.add_extension(cursor=cursor,
                                    extension=Metadata.REFERENCE)
