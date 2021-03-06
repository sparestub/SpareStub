# Standard Imports
import logging

# 3rd Party Imports
from requests.exceptions import RequestException
from djrill import MandrillAPIError
import premailer

# Django Imports
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string

def normalize_email(email):
    """
    Normalize the address by lowercasing the domain part of the email
    address.
    """
    email = email or ''
    try:
        email_name, domain_part = email.strip().rsplit('@', 1)
    except ValueError:
        pass
    else:
        email = '@'.join([email_name, domain_part.lower()])
    return email


def send_email(recipient_list, subject, message, template=None, from_email='', from_name='', **kwargs):
    """
    Generic function to send an email. We encapsulate the 3rd party API call in case we every change APIs

    returns: True - If the email sent successfully
             False - If the email failed to send
    """
    # It's convenient to disable emails on the development machines sometimes
    if not settings.SEND_EMAILS:
        return False

    if not isinstance(recipient_list, list):
        recipient_list = [recipient_list]

    if not from_email:
        from_email = settings.SOCIAL_EMAIL_ADDRESS

    if not from_name:
        from_name = settings.SOCIAL_EMAIL_NAME

    fail_silently = kwargs.get('fail_silently', False)

    try:
        # HACK: per steph's request, making this work for submission of tickets.		
        bcc_recipient_list = None		
        if subject == 'SpareStub has received your ticket submission!':		
            bcc_recipient_list = [settings.ADMIN_EMAIL_ADDRESS]

        if template:
            html = premailer.transform(render_to_string(template, kwargs), settings.DOMAIN)
            if html:
                msg = EmailMultiAlternatives(subject=subject, from_email=from_email, to=recipient_list, bcc=bcc_recipient_list, body=message)
                msg.attach_alternative(html, 'text/html')
                msg.send(fail_silently=fail_silently)
        else:
            send_mail(subject, message, from_email, recipient_list, fail_silently=fail_silently)

    except MandrillAPIError as e:
         # Mandrill errors are thrown as exceptions
        logging.critical('A mandrill error occurred. Status code {}'.format(e.status_code))
        # TODO queue message and try again later and bolster logging

    except RequestException as e:
        # Generally occurs when the internet is not connected
        logging.critical('Cannot connect to email server: error {}'.format(str(e)))
        # TODO queue these up

    except Exception as e:
        # Generally catch all
        logging.critical('General exception caught: error {}'.format(str(e)))        