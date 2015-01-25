var $ = jQuery;
var document = window.document;

function validate_date_not_before_today(value) {
    /*
    This function will be used by bootstrap validator as a callbackto validate the
    event date of the ticket to ensure that it is not before the current date.
     */
    'use strict';

    var value_array = value.split('/');
    var inputted_date = new Date(value_array[2], value_array[0] - 1, value_array[1]);
    var today = new Date();
    inputted_date.setHours(0);
    inputted_date.setMinutes(0);
    inputted_date.setSeconds(0);
    inputted_date.setMilliseconds(0);
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    if (inputted_date >= today) {
        return true;
    }
    return false;
}

function prepare_stripe() {
    'use strict';

    var handler = StripeCheckout.configure({
        key: window.additional_parameters.stripe_public_key,
        image: window.additional_parameters.logo_icon,
        token: function (token) {
            $('#token').val(token.id); // Insert stripe token into form before serializing
            $.post(window.additional_parameters.submit_ticket_url, $('#submit-ticket-form').serialize(), "json")
                .done(function (response) {
                    //This can only be done once all the form data is submitted.
                    // Notice this is the submit ticket form we are clearing out here
                    $('#submit-ticket-form').data('bootstrapValidator').resetForm(true);
                })
                .always(function (response) {
                    handle_ajax_response(response);
                });
        }
    });

    // Open Stripe checkout modal
    handler.open({
        name: 'SpareStub',
        description: window.additional_parameters.ticket_title,
        allowRememberMe: true,
        email: window.additional_parameters.user_email,
        panelLabel: 'Pay $5 Fee'
    });

    // Close Checkout on page navigation
    $(window).on('popstate', function () {
        handler.close();
    });
}


// We need to kick the function off when we finish loading the modal content/
// It appears as in callback to the ajax request that grabs this content in base.html
function initialize_bootstrap_validator_submit_ticket() {
    'use strict';

    var customer_exists = false;  // Done this user have a customer record in our system? Assume no.

    $.get(window.additional_parameters.customer_exists_url, "json")
        .done(function () {
            customer_exists = true;
            // Change the action on the form to just submit the ticket
            $('#submit-ticket-form').attr('action', window.additional_parameters.submit_ticket_url);
            // Change the button to read submit stub instead of continue
            $('#submit-ticket-form-submit-button').text('Submit Stub');
        })
        .fail(function () {
            customer_exists = false;
        });


    var $submit_ticket_form = $('#submit-ticket-form');

    // Need to do this again now that the DOM has changed
    initialize_date_pickers();

    $('.time-picker').datetimepicker({
        pickDate: false
    });

    // Configure the ticket price to work as a currency
    $('#submit-ticket-price').autoNumeric('init')
        // autoNumeric completely breaks bootstrap validator. Just make sure the field is validated when we lose focus.
                             .blur(function () { $('#submit-ticket-form').bootstrapValidator('revalidateField', 'price'); });

    $submit_ticket_form.bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        submitButtons: $('#submit-ticket-form-submit-button')
    }).on('success.form.bv', function (e) {
        // Prevent form submission
        e.preventDefault();

        // Get the form instance
        var $form = $(e.target);

        $.post($form.attr('action'), $form.serialize(), 'json')
            .done(function (data) {
                // If a notification error exists in the modal currently that was not cleared by the user, clear it now.
                // We don't want it to exist if the user opens the modal and tries to submit another ticket.
                clear_notification($('#submit-ticket-notification-root'));
                $('#modal-submit-ticket-root').modal('hide');

                // If the user does not have a customer record, make sure the stripe window will pop up
                if (!customer_exists) {
                    $('#stripe-submit-popup-notification-root').modal('show');

                    // In case the user submits another ticket, prepare it to not ask for a token next time
                    customer_exists = true;
                    // Change the action on the form to just submit the ticket
                    $('#submit-ticket-form').attr('action', window.additional_parameters.submit_ticket_url);
                    // Change the button to read submit stub instead of continue
                    $('#submit-ticket-form-submit-button').text('Submit Stub');

                // This will display the ticket submission successful window
                } else {
                    handle_ajax_response(data);

                    // If the ticket was already creted, clear the form now.
                    // Otherwise do it after the stripe form closes and submit the form information to the server.
                    $form.data('bootstrapValidator').resetForm(true);
                }
            })
            .fail(function (data) {
                // Obviously there are cases were we never reached the server (internet down or incredibly high loads
                // resulting in the web server turning people away), so we cannot check the JSON object that might or
                // might not have been returned by the application level.
                var $notification_root = $('#submit-ticket-notification-root');
                handle_ajax_response(data.responseJSON, $notification_root);
                // If a specific notification was not sent back but a failure status code was,
                // set a generic no tification error
                if (!has_notification_update(data.responseJSON)) {
                    set_notification($notification_root, 'Uh oh!',
                                     "Something went wrong. Try again in a bit!", 'alert-danger');
                }
                $form.data('bootstrapValidator').resetField('start_time', true);
                $form.data('bootstrapValidator').resetField('location_raw', true);
            });
    });

    // Start out validated since not required.
    $('#modal-submit-ticket-root').on('shown.bs.modal', function () {
        $('#submit-ticket-form').bootstrapValidator('revalidateField', 'about');
    });

    // Bootstrap validator will break the datetime picker. We need this function to undo the breakage.
    $('#submit-ticket-date-picker').on('dp.change dp.show', function (e) {
        $('#submit-ticket-form').bootstrapValidator('revalidateField', 'start_date');
    });

    // Bootstrap validator will break the datetime picker. We need this function to undo the breakage.
    $('#submit-ticket-time-picker').on('dp.change dp.show', function (e) {
        $('#submit-ticket-form').bootstrapValidator('revalidateField', 'start_time');
    });

    // Make sure that when the popup closes, it initializes the stripe form
    $(document).on('hidden.bs.modal', function (e) {
        if (e.target.id === 'stripe-submit-popup-notification-root') {
            prepare_stripe();
        }
    });
}