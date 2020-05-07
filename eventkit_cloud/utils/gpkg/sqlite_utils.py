from sqlite3 import connect, Row


class SQL(object):
    def __init__(self, query_string):
        self.query_string = query_string


class _TableQuery(object):
    def __init__(self, cursor, table_name):
        self._cursor = cursor
        self._table_name = table_name
        self._where_columns = None

    @property
    def cursor(self):
        return self._cursor

    def validate(self):
        if not Table.exists(cursor=self._cursor, table_name=self._table_name) and self._table_name != "sqlite_master":
            raise ValueError("Table must exist to select entries from it")

    @staticmethod
    def _build_where(where_conditions):
        """
        Builds a tuple containing the string that constitutes the query's WHERE clause and a tuple containing
        the values to be substituted into the clause string.

        :param where_conditions: dictionary mapping column names to the values to be searched against.
        :return:
        """
        if where_conditions is None:
            return "", tuple()
        clauses = [f"""[{_key}] {'IS NULL' if _val is None else '= ?'}""" for _key, _val in where_conditions.items()]
        values = tuple([_value for _value in where_conditions.values() if _value is not None])
        return f"""WHERE {' AND '.join(clauses)}""", values

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
            select_columns = "*"
        else:
            select_columns = ", ".join(select_columns)

        where_clause, where_values = self._build_where(self._where_columns)
        self._cursor.execute(
            f"""
            SELECT {select_columns} 
            FROM {self._table_name} 
            {where_clause}
            """,
            where_values,
        )
        return self


class Update(_TableQuery):
    def __init__(self, cursor, table_name):
        super(Update, self).__init__(cursor, table_name)
        self._set_columns = None

    @staticmethod
    def get_values(set_columns):
        return [_value for _value in set_columns.values() if not isinstance(_value, SQL)]

    @staticmethod
    def get_value_insert(value):
        if isinstance(value, SQL):
            return value.query_string
        return "?"

    @staticmethod
    def _build_set(set_columns):
        return ", ".join(
            [f"""[{_name}] = {Update.get_value_insert(_value)}""" for _name, _value in set_columns.items()]
        )

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

        where_clause, where_values = self._build_where(self._where_columns)
        self._cursor.execute(
            f"""
            UPDATE {self._table_name} 
            SET {self._build_set(self._set_columns)} 
            {where_clause}
            """,
            tuple(Update.get_values(self._set_columns)) + where_values,
        )
        return self


class Insert(Update):
    def execute(self):
        self.validate()

        set_columns = self._set_columns.keys()
        if any(column_name is None or len(column_name) == 0 for column_name in set_columns):
            raise ValueError("The column names cannot be None or empty")

        column_names = ", ".join([f"[{_column}]" for _column in self._set_columns.keys()])
        self._cursor.execute(
            f"""
            INSERT INTO {self._table_name} 
            ({column_names}) 
            VALUES ({', '.join([Insert.get_value_insert(_column) for _column in self._set_columns.values()])})
            """,
            tuple(Insert.get_values(self._set_columns)),
        )
        return self


class Table(_TableQuery):
    def insert(self):
        return Insert(self.cursor, self._table_name)

    def update(self):
        return Update(self.cursor, self._table_name)

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
        cursor.execute(
            """
                           SELECT name 
                           FROM sqlite_master 
                           WHERE type='table' AND name=?;
                       """,
            (table_name,),
        )
        return bool(cursor.fetchone())

    @staticmethod
    def validate_table(cursor, table_name, expected_columns):
        """
        Validate the table to ensure the table with a name table_name exists with the expected columns given. Raises an
        error if columns aren't what is expected or table doesn't exist.

        :param cursor: the cursor to the GeoPackage database's connection
        :param table_name: the name of the expected table
        :param expected_columns: a list of strings with the names of the columns
        """
        if not Table.exists(cursor=cursor, table_name=table_name):
            raise ValueError(f"Table {table_name} does not exist. Cannot retrieve entries from a non-existent table")
        if not Table.columns_exists(cursor=cursor, table_name=table_name, column_names=expected_columns):
            raise ValueError(f"Invalid Schema. The table does not have the expected columns: {expected_columns}.")

    @staticmethod
    def columns_exists(cursor, table_name, column_names):
        """
        Validates the existence for several columns in a table.

        :param cursor: the cursor to the database's connection
        :param table_name: the name of the table with the column
        :param column_names: the list of column names to verify exist in the table
        :return: True if the column exists, false otherwise
        """
        cursor.execute(
            """
                        PRAGMA table_info("{table_name}")
                        """.format(
                table_name=table_name
            )
        )
        found_columns = [_row["name"] for _row in cursor]
        return all(any(_existing_column == _column for _existing_column in found_columns) for _column in column_names)

    def insert_or_update_row(self, set_columns, where_columns):
        """
        Searches for a row matching the clauses defined by mappings in where_columns. If exactly one row is returned,
        an update operation will be performed. If 0 or multiple rows are returned, an insert operation will take place.

        In either case, affected row will have the values defined in set_columns.

        :param set_columns: dictionary mapping a set of column names to their new/inserted values.
        :param where_columns: dictionary mapping a set of column names to their current values, search against these.
        """
        self.select().where(**where_columns).execute()
        existing_row = self.cursor.fetchall()

        if existing_row is None or len(existing_row) > 1 or len(existing_row) == 0:
            self.insert().set(**set_columns).execute()
        else:
            self.update().set(**set_columns).where(**where_columns).execute()
        return self


def get_database_connection(file_path, timeout=0.0):
    """
    Gets a Connection to an Sqlite Database

    :param timeout: how long in seconds the driver will attempt to execute a statement before aborting.
    :param file_path: path to the sqlite database

    :return: a connection to the database
    """
    db_connection = connect(database=file_path, timeout=timeout)
    db_connection.row_factory = Row
    return db_connection
