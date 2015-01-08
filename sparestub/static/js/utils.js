/**
 * Created by nicholasdrane on 10/10/14.
 */

var $ = jQuery

var has_notification_update = function (response) {
    'use strict';
    return response.notification_type && response.notification_content;
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
        $notification_root.append('<div class="notification-style" data-dismiss="alert">' +
                                   '<a href="#" class="close" data-dismiss="alert">×</a>' +
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
    if (!$notification_root) {
        $notification_root = $('#notification-root');
    }
    if (!response) {
        return;
    }
    if (!!response.redirect_href) {
        window.location.href = response.redirect_href;
    // If it's not a complete redirect, then we are replacing specific elements of the DOM.  Do that here.
    } else {
        if (has_notification_update(response)) {
            set_notification($notification_root,
                             response.notification_content,
                             response.notification_type);
        }


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

/*
var store_in_local = function (key, data_to_store, is_data_json) {
    'use strict';
    if (Modernizr.localstorage) {
        if (is_data_json) {
            data_to_store = JSON.stringify(data_to_store);
        }
        var compressed = LZString.compress(data_to_store);
        localStorge.setItem(key, compressed);
    }
};

var retrieve_from_local = function (key, is_data_json){
    'use strict';
    var data;
    if (Modernizr.localstorage) {
        data = LZString.decompress(localStorage.getItem(key));
    }
    if (is_data_json) {
        data = JSON.parse(data);
    }
    return data;
};*/

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