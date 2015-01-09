/**
 * Created by nicholasdrane on 10/10/14.
 */

var $ = jQuery

var has_notification_update = function (response) {
    'use strict';
    return response.notification_type && response.notification_content;
};

var has_popup_notification = function (response) {
    'use strict';
    return response.popup_notification_type && response.popup_notification_content;
};

var clear_notification = function ($notification_root) {
    // Completely remove a notification
    $notification_root.empty();
};

var set_notification = function ($notification_root, content_message, message_type) {
   'use strict';

    // The close button removes everything inside the root when clicked. Instead of using a custom event,
    // Just make sure everything exists before we try to edit it's contents.
    if ($notification_root.children().length === 0) {
        $notification_root.append('<div class="notification-style">' +
                                   '<a class="close">×</a>' +
                                   '<span class="notification-content"></span>' +
                                  '</div>'
                                 );
        }

    // These statemements allow us to generically have many notification roots, typically in modal forms for errors.
    $notification_root.find('.notification-content').html(content_message);

    //We need style the notification-style div as opposed to the root div so that styles do not persist after the
    //alert is dismissed and the contents of the notification root are deleted.
    $notification_root.find(".notification-style")
                      .addClass('alert ' + message_type)
                      .css('display', '');
};

var handle_ajax_response = function (response, $notification_root) {
    'use strict';
    // If we aren't updating the notification root on a modal, then update the site's main notification bar.
    if (!response) {
        return;
    }


    if (!$notification_root) {
        $notification_root = $('#notification-root');
    }

    if (!!response.redirect_href) {
        window.location.href = response.redirect_href;

    // If we want to close to current modal and show a new one that only displays a notification.
    } else if (has_popup_notification(response)) {
        show_popup_notification_modal(response.popup_notification_content,
                                      response.popup_notification_type);

    // If we want to show a notification inside the currently open modal
    } else if (has_notification_update(response)) {
        set_notification($notification_root,
                         response.notification_content,
                         response.notification_type);

    // We expect any ajax response to either redirect, give a notification, or reload the current page
    } else {
        window.location.reload();
    }
};

function add_success_checkmark($target) {
    /* Remove the old glyphicon associated with a element and add a success checkmark */
    'use strict';
    $target.empty();
    $target.append('<span class="glyphicon glyphicon-ok">');

}

function add_failure_x($target) {
    /* Remove the old glyphicon associated with a element and add a failure x */
    'use strict';
    $target.empty();
    $target.append('<span class="glyphicon glyphicon-remove">');
}

function prepare_yes_cancel_modal(title, post_url, modal_yes_function) {
    'use strict';

    var $modal_yes = $('#modal-yes');

    // Remove current functionality attached to this button. Who knows how it was last used.
    $modal_yes.unbind();

    // And assign something new
    if (typeof modal_yes_function === 'function') {
        $modal_yes.unbind().on('click', modal_yes_function);
    }

    $('#modal-yes-cancel-title').text(title);

    if (post_url) {
        $('#modal-yes-cancel-form').attr('action', post_url);
        $modal_yes.attr('type', 'submit');
    } else {
        $modal_yes.attr('type', 'button');
    }
}

function show_popup_notification_modal(notification_content, notification_type) {
    'use strict';
    // Make sure that a modal is not currently open. Close it if one is.
    $('.in.modal').modal('hide');

    var $modal_popup_notification_content = $('#modal-popup-notification-content');
    $modal_popup_notification_content.addClass('alert-' + notification_type);
    $modal_popup_notification_content.text(notification_content);
    $('#modal-popup-notification-root').modal('show');
}