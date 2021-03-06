// We need to kick the function off when we finish loading the modal content/
// It appears as in callback to the ajax request that grabs this content in base.html
function initialize_bootstrap_validator_message_user() {
    'use strict';

    $('#message-user-form').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        submitButtons: $('#message-user-form-submit-button')
    }).on('success.form.bv', function (e) {
        // Prevent form submission
        e.preventDefault();

        // Get the form instance
        var $form = $(e.target);

        $.post($form.attr('action'), $form.serialize(), 'json');
    });
}

function load_message_user_modal(show_modal) {
    'use strict';
    /* Load the message user modal content from the server and display that form if requested.
    params: show_modal - true = Display modal message user form immediately.
                         false = Do not display the modal sign up form.
    */

    if (!window.additional_parameters.is_authenticated) {
        load_login_modal(true);
        return;
    }

    // Before we load the message user modal, make sure the user is allowed to message about this ticket.
    $.get(window.additional_parameters.can_message_url,
           {'other_user_id': window.additional_parameters.user_id,
            'ticket_id': window.additional_parameters.ticket_id
            },
          'json')
        .fail(function (response) {
            handle_ajax_response(response);
        })
        .done(function () {
             var $modal_message_user_form_content = $('#modal-message-user-form-content');
            // If the modal content has already been loaded, don't do it again
            if ($modal_message_user_form_content.children().length > 0) {
                if (show_modal) {
                    $('#modal-message-user-root').modal('show');
                }
                return;
            }
            $.get(window.additional_parameters.message_user_form_url, function (data) {
                $modal_message_user_form_content.html(data);
                initialize_bootstrap_validator_message_user();
                if (show_modal) {
                    $('#modal-message-user-root').modal('show');
                }
                $('#message-user-form-submit-button').on('click', function () {
                    modal_message_user_button();
                });
            });
        });
}

function modal_message_user_button() {
    /* When the user clicks the Send Message button inside the modal messaging form, this tag is called to contact the
     * server and add the message to the database.
     */
    $.post(window.additional_parameters.send_message_url,
        {'other_user_id': window.additional_parameters.user_id,
          'ticket_id': window.additional_parameters.ticket_id,
          'body': $('#message-user-body').val()
          },
          'json')
     .done(function (data, textStatus, xhr) {
         // fire when message is sent.
         ss.gaEvents.track("button", "click", "Sent Message", {});
     })
    .fail(function(response) {
        handle_ajax_response(response);
    });
}

function show_ajax_message(message, type) {
    var $ajax_errors = $('#ajax-errors');
    var $alert_div = $ajax_errors.find('.alert');
    $alert_div.removeClass('alert-danger').removeClass('alert-success').addClass('alert-' + type).find('p').text(message);
    $ajax_errors.css('display', '');
}

function prepare_delete_ticket_button() {
    // This looks dumb at first glance. Why do we prepare the modal every time a user clicks on the button?
    // The answer is that this modal is multi-purposed, and another button might use it in the future.
    $('#delete-ticket').on('click', function () {
        can_delete_ticket();
    });
}

function can_delete_ticket() {
    $.get(window.additional_parameters.can_delete_ticket_url, 'json')
        .done(function () {
            show_yes_cancel_modal('<p>Are you sure you want to permanently delete this ticket listing?</p>' +
                                  '<p>Note: Your deleted tickets appear in the Past Tickets section of your profile.</p>',
                                   window.additional_parameters.delete_ticket_url);
        })
        .fail(function (response) {
            var error_message = handle_ajax_response(response);
            show_ajax_message(error_message, 'danger');
        });
}


function setup_stripe_popup_modal() {
    'use strict';

    /* These are the settings that the stripe modal will use */
    var handler = StripeCheckout.configure({
        key: window.additional_parameters.stripe_public_key,
        image: window.additional_parameters.logo_icon,
        token: function (token) {
              // Use the token to create the charge with a server-side script.
              // You can access the token ID with `token.id`
            $.post(window.additional_parameters.request_to_buy_url,
                  {'token': token.id,
                   'card_id': token.card.id,
                   'ticket_id': window.additional_parameters.ticket_id},
                   "json")
                .done(function (response) {
                    request_to_buy_success(response);
                })
                .fail(function (response) {
                    var error = handle_ajax_response(response);
                    show_ajax_message(error, 'danger');
                });
        }
    });

    // When the notification popup closes, open Stripe immediately afterwards
    $(document).on('hidden.bs.modal', function (e) {
        if (e.target.id === 'stripe-popup-notification-root') {
            show_stripe_modal(handler);
        }
    });

    // Close Checkout on page navigation
    $(window).on('popstate', function () {
        handler.close();
    });
}

function show_pre_stripe_popup() {
    $('.in.modal').modal('hide');
    $('#stripe-popup-notification-root').modal('show');
}

function can_request_to_buy() {
    /* There are some cases where we will not allow a user to request to buy a ticket.
     * If the ticket was cancelled or the buyer is already going to another show or already requested to buy this ticket
     */
    'use strict';

    return $.post(window.additional_parameters.can_request_ticket_url,
                  {'ticket_id': window.additional_parameters.ticket_id},
                  "json");
}

function cancel_request_to_buy() {
    $.post(window.additional_parameters.cancel_request_to_buy_url,
           {'ticket_id': window.additional_parameters.ticket_id},
           "json")
        .done(function (response) {
            var message = handle_ajax_response(response);
            show_ajax_message(message, 'success');
            $('#cancel-request').replaceWith('<button id="request-to-buy" class="btn btn-primary">Request To Buy</button>');
            $('#request-to-buy').on('click', request_to_buy);
        })
        .fail(function (response) {
            var error_message = handle_ajax_response(response);
            show_ajax_message(error_message, 'danger');

        });
}

function show_stripe_modal(handler) {
    'use strict';

    // Open Stripe checkout modal
    handler.open({
            name: 'SpareStub',
            description: window.additional_parameters.ticket_title,
            allowRememberMe: true,
            email: window.additional_parameters.user_email,
            panelLabel: 'Pay $5 Fee'
    });
}

function request_to_buy() {
    // Users cannot request to buy tickets if they are not logged in
    if (!window.additional_parameters.is_authenticated) {
        load_login_modal(true);
        return;
    }
    var can_request_response = can_request_to_buy();

    can_request_response.done(function (response) {
        show_pre_stripe_popup();
    })
    .fail(function (response) {
        var error_message = handle_ajax_response(response);
        show_ajax_message(error_message, 'danger');
    });
}

function request_to_buy_success(response) {
    /* Kick this off whenever a request to buy successfully goes through */
    var message = handle_ajax_response(response);
    $('#request-to-buy').replaceWith('<button id="cancel-request" class="btn btn-primary">Cancel Request To Buy</button>');
    $('#cancel-request').on('click', cancel_request_to_buy);
    show_ajax_message(message, 'success');
}

$(document).ready(function () {
    $('.message-user').on('click', function () {
        load_message_user_modal(true);
    });  // The show_modal parameter is false because we can expect the data attributes
                                        // in the HTML to handle it for us
    $('#request-to-buy').on('click', request_to_buy);
    prepare_delete_ticket_button();
    setup_stripe_popup_modal();

    $('#cancel-request').on('click', cancel_request_to_buy);
});