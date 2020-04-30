from urllib.parse import urlparse


class TableNames(object):
    GPKG_METADATA = "gpkg_metadata"
    GPKG_EXTENSIONS = "gpkg_extensions"


class Table(object):
    NAME = ''
    COLUMNS = []

    def __init__(self, **kwargs):
        self.columns = {_column: kwargs.get(_column, None) for _column in self.COLUMNS}

    @classmethod
    def from_row(cls, sqlite_row):
        return cls(**sqlite_row.items())

    def to_dict(self):
        return dict(**self.columns)

    def __getitem__(self, item):
        return self.columns[item]

    def validate(self):
        return True


class MetadataEntry(Table):
    """
    Metadata object that represents an entry in the gpkg_metadata Table
    """
    NAME = TableNames.GPKG_METADATA
    COLUMNS = ['md_standard_uri',
               'metadata',
               'md_scope',
               'mime_type']

    def validate(self):
        if self['metadata'] is None:
            raise ValueError("Metadata cannot be None.")
