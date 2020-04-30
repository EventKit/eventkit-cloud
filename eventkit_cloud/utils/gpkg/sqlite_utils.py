from sqlite3 import Cursor, connect, Row

from eventkit_cloud.utils.gpkg.tables import TableNames, MetadataEntry


class _TableQuery(object):
    def __init__(self, cursor, table_name):
        self._cursor = cursor
        self._table_name = table_name
        self._where_columns = None

    @property
    def cursor(self):
        return self._cursor

    def validate(self):
        if not Table.exists(cursor=self._cursor,
                            table_name=self._table_name):
            raise ValueError("Table must exist to select entries from it")

    @staticmethod
    def _build_where(where_conditions):
        if where_conditions is None:
            return ""
        clauses = [f"""[{_key}] {'IS NULL' if _val is None else '= ?'}""" for _key, _val in where_conditions.items()]
        return f"""WHERE {' AND '.join(clauses)}"""

    def where(self, **column_conditions):
        self._where_columns = column_conditions if len(column_conditions) else None
        return self


class From(_TableQuery):

    def __init__(self, cursor, table_name):
        super(From, self).__init__(cursor, table_name)
        self._select_columns = None

    def select(self, *columns):
        self._select_columns = columns if len(columns) else None
        return self

    def execute(self):
        # check if the table exists before querying for rows
        self.validate()

        select_columns = self._select_columns or []
        where_columns = (self._where_columns or {}).keys()
        all_columns = set([_column for _list in [select_columns, where_columns] for _column in _list])
        if any(column_name is None or len(column_name) == 0 for column_name in all_columns):
            raise ValueError("The column names cannot be None or empty")

        if len(select_columns) == 0:
            select_columns = '*'
        else:
            select_columns = ', '.join(select_columns)

        self._cursor.execute(f"""
            SELECT {select_columns} 
            FROM {self._table_name} 
            {self._build_where(self._where_columns)}
            """, tuple([_value for _value in self._where_columns.values() if _value is not None]))
        return self


class Update(_TableQuery):

    def __init__(self, cursor, table_name):
        super(Update, self).__init__(cursor, table_name)
        self._set_columns = None

    @staticmethod
    def _build_set(set_columns):
        return ' = ?, '.join([f"""[{_column}]""" for _column in set_columns.keys()]) + ' = ? '

    def validate(self):
        super(Update, self).validate()
        if not self._set_columns:
            raise ValueError("Update must specify values to set.")

    def set(self, **set_columns):
        self._set_columns = set_columns
        return self

    def execute(self):
        self.validate()

        where_columns = (self._where_columns or {}).keys()
        set_columns = self._set_columns.keys()
        all_columns = set([_column for _list in [set_columns, where_columns] for _column in _list])
        if any(column_name is None or len(column_name) == 0 for column_name in all_columns):
            raise ValueError("The column names cannot be None or empty")

        self._cursor.execute(f"""
            UPDATE {self._table_name} 
            SET {self._build_set(self._set_columns)} 
            {self._build_where(self._where_columns)}
            """, tuple([_value for _value in self._set_columns.values() if _value is not None]
                       + [_value for _value in self._where_columns.values() if _value is not None]))
        return self


class Insert(Update):

    def execute(self):
        self.validate()

        set_columns = self._set_columns.keys()
        if any(column_name is None or len(column_name) == 0 for column_name in set_columns):
            raise ValueError("The column names cannot be None or empty")

        column_names = ', '.join([f"[{_column}]" for _column in self._set_columns.keys()])

        self._cursor.execute(f"""
            INSERT INTO {self._table_name} 
            ({column_names}) 
            VALUES ({', '.join(['?' for _column in self._set_columns])})
            """, tuple([_value for _value in self._set_columns.values() if _value is not None]))
        return self


class Table(Update):

    def insert(self):
        return Insert(self.cursor, self._table_name)

    def update(self):
        return Insert(self.cursor, self._table_name)

    def select(self, *select_columns):
        return From(self.cursor, self._table_name).select(*select_columns)

    def __init__(self, cursor, table_name):
        super(Table, self).__init__(cursor, table_name)

    @staticmethod
    def exists(cursor, table_name):
        """
        Checks and validates a table name against the master list of all tables present in the db.

        :param cursor: the cursor to the database's connection
        :param table_name: the name of the table searching for
        :return: true if the table exists, false otherwise
        """
        cursor.execute("""
                           SELECT name 
                           FROM sqlite_master 
                           WHERE type='table' AND name=?;
                       """, (table_name,))
        return bool(cursor.fetchone())

    @staticmethod
    def validate_table_schema(cursor,
                              table_name,
                              expected_columns):
        """
        Validate the table to ensure the table with a name table_name exists with the expected columns given. Raises an
        error if columns aren't what is expected or table doesn't exist.

        :param cursor: the cursor to the GeoPackage database's connection
        :type cursor: Cursor
        :param table_name: the name of the expected table
        :param expected_columns: a list of strings with the names of the columns
        """
        if not Table.exists(cursor=cursor,
                            table_name=table_name):
            raise ValueError(f"Table {table_name} does not exist. Cannot retrieve entries from a non-existent table")
        if not Table.columns_exists(cursor=cursor,
                                    table_name=table_name,
                                    column_names=expected_columns):
            raise ValueError(f"Invalid Schema. The table does not have the expected columns: {expected_columns}.")
    @staticmethod
    def columns_exists(cursor,
                       table_name,
                       column_names):
        """
        Validates the existence for several columns in a table.

        :param cursor: the cursor to the database's connection
        :param table_name: the name of the table with the column
        :param column_names: the list of column names to verify exist in the table
        :return: True if the column exists, false otherwise
        """
        cursor.execute("""
                        PRAGMA table_info("{table_name}")
                        """.format(table_name=table_name))
        found_columns = [_row['name'] for _row in cursor]
        return all(
            any(_existing_column == _column for _existing_column in found_columns) for _column in column_names)

    def insert_or_update_row(self, set_columns, where_columns):
        """
        Searches for a row matching the clauses defined by mappings in where_columns. If exactly one row is returned,
        an update operation will be performed. If 0 or multiple rows are returned, an insert operation will take place.

        In either case, affected row will have the values defined in set_columns.

        :param set_columns: dictionary mapping a set of column names to their new/inserted values.
        :param where_columns: dictionary mapping a set of column names to their current values, search against these.
        """
        self.select().where(**where_columns)
        existing_row = self.cursor.fetchall()

        if existing_row is None or len(existing_row) > 1 or len(existing_row) == 0:
            self.insert().set(**set_columns).execute()
        else:
            self.update().set(**set_columns).where(**where_columns).execute()
        return self


class GpkgUtil(object):

    @staticmethod
    def get_database_connection(file_path,
                                timeout=0.0):
        """
        Gets a Connection to an Sqlite Database

        :param timeout: how long in seconds the driver will attempt to execute a statement before aborting.
        :param file_path: path to the sqlite database

        :return: a connection to the database
        """
        db_connection = connect(database=file_path,
                                timeout=timeout)
        db_connection.row_factory = Row
        return db_connection

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
            GpkgUtil.create_metadata_table(cursor=cursor)

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
        # GeoPackageMetadataTableAdapter.validate_metadata_table(cursor=cursor)

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
        #
        # # register extension in the extensions table
        # if not GpkgUtil.has_extension(cursor=cursor,
        #                               extension=GeoPackageMetadataTableAdapter()):
        #     GeoPackageExtensionsTableAdapter.insert_or_update_extensions_row(cursor=cursor,
        #                                                                      extension=GeoPackageMetadataTableAdapter())

    @staticmethod
    def has_extension(cursor, extension):
        """
        Returns True if the GeoPackage has the extension, False otherwise

        :param cursor: the cursor to the GeoPackage database's connection
        :type cursor: Cursor

        :param extension: an Extension entry in the gpkg_extensions table to check if it exists or not
        :type extension: ExtensionEntry

        :return  Returns True if the GeoPackage has the extension, False otherwise
        :rtype: bool
        """
        if not Table.exists(cursor=cursor,
                            table_name=TableNames.GPKG_EXTENSIONS):
            return False

        # select all the rows
        Table(cursor=cursor,
              table_name=TableNames.GPKG_EXTENSIONS).select(
            'table_name', 'column_name', 'extension_name', 'definition', 'scope'
        ).where(table_name=extension.table_name,
                column_name=extension.column_name,
                extension_name=extension.extension_name).execute()
        rows = cursor.fetchall()

        return rows is not None and len(rows) > 0
