message_model_settings = {'BODY_MAX_LENGTH': 5000,
                          'MESSAGE_STATUSES': (('A', 'Active'),    # Associated with a ticket whose event date has not passed
                                               ('F', 'Flagged'),   # A message that was flagged illicit by a user
                                               )}

send_message_form_settings = {'BODY_NOTEMPTY_MESSAGE': 'Please enter a message.',}
send_message_form_settings.update(message_model_settings)

# These keys need to be defined after their respective MINLENGTH and MAXLENGTH keys
#  have been defined to avoid key errors.
send_message_form_settings['BODY_LENGTH_MESSAGE'] = 'Please keep your message under {} characters'.\
                                                    format(send_message_form_settings.get('BODY_MAX_LENGTH'))

NEW_MESSAGE_SUBJECT = 'New SpareStub Message'
NEW_MESSAGE_EMAIL = 'messages/new_message.html'