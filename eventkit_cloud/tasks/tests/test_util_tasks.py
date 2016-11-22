from mock import patch

from eventkit_cloud.tasks.models import (
     ExportProviderTask,
     ExportTask,
     ExportRun,
)
from eventkit_cloud.tasks.tests.test_export_tasks import ExportTaskBase
from eventkit_cloud.tasks.export_tasks import (
    FinalizeExportProviderTask,
    FinalizeRunTask
)
from eventkit_cloud.tasks.util_tasks import RevokeTask


class TestRevokeTask(ExportTaskBase):
    @patch('shutil.rmtree')
    def test_revoke_task(self, rmtree):
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task'
        )
        saved_export_task_uid = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status='PENDING',
            name="test_task"
        ).uid
        import pdb; pdb.set_trace()

        rt = RevokeTask()
        rt.run(export_provider_task.uid)

        export_provider_task = ExportProviderTask.objects.get(
              uid=export_provider_task.uid
        )

        self.assertEqual(export_provider_task.status, 'CANCELED')
        self.assertTrue(all(
            _.status == 'CANCELED' for _ in export_provider_task.tasks.all()
        ))

        fept = FinalizeExportProviderTask()
        fept.run(
            run_uid=self.run.uid,
            export_provider_task_uid=export_provider_task.uid,
            stage_dir='/tmp/notreal'
        )
        frt = FinalizeRunTask()
        frt.run(run_uid=self.run.uid, stage_dir='/tmp/notreal')
        
        export_provider_task = ExportProviderTask.objects.get(
              uid=export_provider_task.uid
        )

        self.assertEqual(export_provider_task.status, 'CANCELED')
        self.assertTrue(all(
            _.status == 'CANCELED' for _ in export_provider_task.tasks.all()
        ))

        self.run = ExportRun.objects.get(uid=self.run.uid)
        self.assertEqual(self.run.status, 'COMPLETED')
