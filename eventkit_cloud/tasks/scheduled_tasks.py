# -*- coding: utf-8 -*-
from django.utils import timezone
from django.conf import settings
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives

from celery import Task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


class PurgeUnpublishedExportsTask(Task):
    """
    Purge unpublished export tasks after 48 hours.
    """

    name = "Purge Unpublished Exports"

    def run(self,):
        from eventkit_cloud.jobs.models import Job
        time_limit = timezone.now() - timezone.timedelta(hours=48)
        expired_jobs = Job.objects.filter(created_at__lt=time_limit, published=False)
        count = expired_jobs.count()
        logger.debug('Purging {0} unpublished exports.'.format(count))
        expired_jobs.delete()


class ExpireRuns(Task):
    """
    Checks all runs.
    Expires all runs older than 2 weeks,
    Emails users one week before scheduled expiration time
    and 2 days before schedule expiration time.
    """

    name = "Expire Runs"

    def run(self):
        from eventkit_cloud.tasks.models import ExportRun
        site_name = getattr(settings, "SITE_NAME", "cloud.eventkit.dev")
        runs = ExportRun.objects.all()

        for run in runs:
            expiration = run.expiration
            email = run.user.email
            if not email:
                break
            uid = run.job.uid
            url = 'http://{0}/exports/{1}'.format(site_name, uid)
            notified = run.notified
            now = timezone.now()
            # if expired delete the run:
            if expiration <= now:
                run.delete()

            # if two days left and most recent notification was at the 7 day mark email user
            elif expiration - now <= timezone.timedelta(days=2):
                if not notified or (notified and notified < expiration - timezone.timedelta(days=2)):
                    send_warning_email(expiration, url, email)
                    run.notified = now
                    run.save()

            # if one week left and no notification yet email the user
            elif expiration - now <= timezone.timedelta(days=7) and not notified:
                send_warning_email(expiration, url, email)
                run.notified = now
                run.save()


def send_warning_email(date, url, addr):
    """
    Args:
        date: A datetime object representing when the run will expire
        url: The url to the detail page of the export
        addr: The email address to which the email will be sent

    Returns: None
    """

    subject = "Your Eventkit Data Pack is set to expire."
    to = [addr]
    from_email = getattr(
        settings,
        'DEFAULT_FROM_EMAIL',
        'Eventkit Team <eventkit.team@gmail.com>'
    )
    ctx = {'url': url, 'date': str(date)}

    text = get_template('email/expiration_warning.txt').render(ctx)
    html = get_template('email/expiration_warning.html').render(ctx)
    try:
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()
    except Exception as e:
        logger.error("Encountered an error when sending status email: {}".format(e))
