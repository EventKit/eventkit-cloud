from eventkit_cloud.utils.gpkg.sqlite_utils import Table
from eventkit_cloud.utils.gpkg.tables import TableNames, ExtensionEntry


class Extension(object):
    @staticmethod
    def create_extensions_table(cursor):
        """
         Creates the GeoPackage Extensions table

        :param cursor: the cursor to the GeoPackage database's connection
        """
        cursor.execute(
            f"""
                       CREATE TABLE IF NOT EXISTS {TableNames.GPKG_EXTENSIONS}
                       (table_name     TEXT,
                        column_name    TEXT,
                        extension_name TEXT NOT NULL,
                        definition     TEXT NOT NULL,
                        scope          TEXT NOT NULL,
                        CONSTRAINT ge_tce UNIQUE (table_name, column_name, extension_name))
                     """
        )

    @staticmethod
    def has_extension(cursor, extension):
        """
        Returns True if the GeoPackage has the extension, False otherwise

        :param cursor: the cursor to the GeoPackage database's connection
        :param extension: an Extension entry in the gpkg_extensions table to check if it exists or not
        :return  Returns True if the GeoPackage has the extension, False otherwise
        """
        if not Table.exists(cursor=cursor, table_name=TableNames.GPKG_EXTENSIONS):
            return False

        # select all the rows
        Table(cursor=cursor, table_name=TableNames.GPKG_EXTENSIONS).select(
            "table_name", "column_name", "extension_name", "definition", "scope"
        ).where(
            table_name=extension["table_name"],
            column_name=extension["column_name"],
            extension_name=extension["extension_name"],
        ).execute()
        rows = cursor.fetchall()

        return rows is not None and len(rows) > 0

    @staticmethod
    def add_extension(cursor, extension):
        """
        Adds an extension to the db if not already present.

        :param cursor: active cursor used to connect affect the db.
        :param extension: ExtensionEntry definition
        """
        if not Table.exists(cursor, TableNames.GPKG_EXTENSIONS):
            Extension.create_extensions_table(cursor)

        Table.validate_table(cursor, ExtensionEntry.NAME, ExtensionEntry.COLUMNS)

        if extension["table_name"] is not None and not Table.exists(cursor=cursor, table_name=extension["table_name"]):
            raise ValueError(
                "Extension's table_name is not None and it does not exist in the GeoPackage.  The "
                "table_name must exist before adding it to the extensions table"
            )

        if extension["column_name"] is not None and not Table.columns_exists(
            cursor=cursor, table_name=extension["table_name"], column_names=[extension["column_name"]]
        ):
            raise ValueError(
                f"Extension's column_name is not None and table {extension['table_name']} "
                f"does not have a column named {extension['column_name']}."
            )
        # sqlite does not check uniqueness if any values are null, therefore we have to check ourselves
        # to avoid duplicates
        set_columns = extension.to_dict()
        where_columns = dict(set_columns, definition=extension["definition"], scope=extension["scope"])
        Table(cursor, TableNames.GPKG_EXTENSIONS).insert_or_update_row(set_columns, where_columns)

    @staticmethod
    def ensure_extension(cursor, extension):
        if not Extension.has_extension(cursor=cursor, extension=extension):
            Extension.add_extension(cursor=cursor, extension=extension)
