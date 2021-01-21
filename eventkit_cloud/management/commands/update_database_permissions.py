from django.conf import settings
from django.core.management import BaseCommand
from django.db import connection
from logging import getLogger


logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Updates permissions on database tables."

    def handle(self, *args, **options):
        db_owner = getattr(settings, "DATABASE_TABLE_OWNER")
        if not db_owner:
            return
        tables = self.get_table_names(db_owner)
        print(tables)
        self.update_table_permissions(tables, db_owner)

    def get_table_names(self, db_owner=None):
        """
        Gets the list of tile table names.

        :param gpkg: Path to geopackage file.
        :return: List of tile user data table names in geopackage.
        """

        with connection.cursor() as cursor:
            if db_owner:
                query = f"SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner != '{db_owner}';"
            else:
                query = "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
            cursor.execute(query)
            return [table for (table,) in cursor.fetchall()]

    def update_table_permissions(self, tables, db_owner=None):
        """
        Gets the list of tile table names.

        :param gpkg: Path to geopackage file.
        :return: List of tile user data table names in geopackage.
        """
        with connection.cursor() as cursor:
            for table in tables:
                try:
                    cursor.execute(f"ALTER TABLE {table} OWNER TO {db_owner};")
                except Exception as e:
                    logger.warning(f"Could not update permissions for {table}.")
                    logger.warning(e)
