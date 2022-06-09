from typing import List


def row_to_dict(sqlite_row):
    return {_key: sqlite_row[_key] for _key in sqlite_row.keys()}


class TableNames(object):
    GPKG_METADATA = "gpkg_metadata"
    GPKG_EXTENSIONS = "gpkg_extensions"
    GPKG_METADATA_REFERENCE = "gpkg_metadata_reference"
    GPKG_CONTENTS = "gpkg_contents"


class TableRow(object):
    NAME = ""
    COLUMNS: List[str] = []

    def __init__(self, **kwargs):
        self.columns = {_key: None for _key in self.COLUMNS}
        for _key, _value in kwargs.items():
            self.columns[_key] = _value

    @classmethod
    def from_row(cls, sqlite_row):
        return cls(**row_to_dict(sqlite_row))

    def to_dict(self):
        return dict(**self.columns)

    def __getitem__(self, item):
        return self.columns[item]

    def __setitem__(self, key, item):
        if key not in self.columns.keys():
            raise KeyError(f"'{key}' is not a valid column for table '{self.NAME}'.")
        self.columns[key] = item

    def validate(self):
        return True


class ExtensionEntry(TableRow):
    WRITE_ONLY_SCOPE = "write-only"
    READ_WRITE_SCOPE = "read-write"

    NAME = TableNames.GPKG_EXTENSIONS
    COLUMNS = ["table_name", "column_name", "extension_name", "definition", "scope"]

    def validate(self):
        if self["column_name"] is not None and self["table_name"] is None:
            raise ValueError("Table name may not be None if column name is not None")  # Requirement 80

        if self["table_name"] is not None and len(self["table_name"]) == 0:
            raise ValueError("If table name is not None, it may not be empty")

        if self["column_name"] is not None and len(self["column_name"]) == 0:
            raise ValueError("If column name is not None, it may not be empty")

        if self["extension_name"] is None or len(self["extension_name"]) == 0:
            raise ValueError("Extension name may not be None or empty")

        if self["definition"] is None:
            raise ValueError("Definition may not be None")

        if self["scope"] is None:
            raise ValueError("Scope may not be None")

        if self["scope"].lower() != self.READ_WRITE_SCOPE and self["scope"].lower() != self.WRITE_ONLY_SCOPE:
            raise ValueError(
                f"Scope may only be {self.READ_WRITE_SCOPE}"
                f" or {self.WRITE_ONLY_SCOPE}. Actual Value: {self['scope'].lower()}"
            )


class MetadataEntry(TableRow):
    """
    Metadata object that represents an entry in the gpkg_metadata Table
    """

    NAME = TableNames.GPKG_METADATA
    COLUMNS = ["md_standard_uri", "metadata", "md_scope", "mime_type"]

    def validate(self):
        if self["metadata"] is None:
            raise ValueError("Metadata cannot be None.")


class MetadataReferenceEntry(TableRow):
    NAME = TableNames.GPKG_METADATA_REFERENCE
    COLUMNS = [
        "reference_scope",
        "table_name",
        "column_name",
        "row_id_value",
        "timestamp",
        "md_file_id",
        "md_parent_id",
    ]


class LayerEntry(TableRow):
    NAME = TableNames.GPKG_CONTENTS
    COLUMNS = [
        "table_name",
        "data_type",
        "identifier",
        "description",
        "last_change",
        "min_x",
        "min_y",
        "max_x",
        "max_y",
        "srs_id",
    ]
