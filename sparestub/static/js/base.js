/**
 * Created by nicholasdrane on 10/6/14.
 */

var $ = jQuery;

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
};

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function initialize_location_autocomplete() {
    'use strict';
    var locations = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 5,
        prefetch: {
            url: window.additional_parameters.cities_list_url,
            // the json file contains an array of strings, but the Bloodhound
            // suggestion engine expects JavaScript objects so this converts all of
            // those strings
            filter: function (list) {
                return $.map(list, function (city) {
                    return {
                        name: city[0] + ', ' + city[1],
                        pop: city[2]
                    };
                });
            }
        },
        sorter: function (a, b) {
            var pop_a = a.pop;
            var pop_b = b.pop;
            if (pop_a > pop_b) {
                return -1;
            } else if (pop_a < pop_b) {
                return 1;
            } else {
                return 0;
            }
        }
    });

    // kicks off the loading/processing of `prefetch`
    locations.initialize();

    $('.location-autocomplete').typeahead(
        {
            hint: false
        },
        {
            name: 'locations',
            displayKey: 'name',
            source: locations.ttAdapter()
        }
    );
};

function initialize_date_pickers() {
    'use strict';
    var today = new Date();
    var todayDay = today.getDate();
    var todayMonth = today.getMonth() + 1;
    var todayYear = today.getFullYear();
    $('.date-picker').datetimepicker({
        pickTime: false,
        minDate: todayMonth + '/' + todayDay + '/' + todayYear,
        showToday: true
    });
};

function load_login_modal(show_modal) {
    /* Load the login modal content from the server and display that form if requested.
    params: show_modal - true = Display modal login form immediately.
                         false = Do not display the modal login form.
    */

    var $modal_login_form_content = $('#modal-login-form-content');
    // If the modal content has already been loaded, don't do it again
    if ($modal_login_form_content.children().length > 0) {
        if (show_modal) {
            $('#modal-login-root').modal('show');
        }
        return;
    }
    $.get(window.additional_parameters.login_form_url, function (data) {
        $modal_login_form_content.html(data);
        initialize_bootstrap_validator_login();
        initialize_login_form_signup_link();
        if (show_modal) {
            $('#modal-login-root').modal('show');
        }
    });
};

function load_signup_modal(show_modal, signup_with_redirect) {
    /* Load the signup modal content from the server and display that form if requested.
    params: show_modal - true = Display modal sign up form immediately.
                         false = Do not display the modal sign up form.
            signup_with_redirect -  true = redirect the user to '/' after account creation/login
                                    false = Keep the user on the current page
    */

    var $modal_signup_form_content = $('#modal-signup-form-content');
    // If the modal content has already been loaded, don't do it again
    if ($modal_signup_form_content.children().length > 0) {
        if (show_modal) {
            $('#modal-signup-root').modal('show');
        }
        return;
    }
    $.get(window.additional_parameters.signup_form_url, function (data) {
        $modal_signup_form_content.html(data);
        initialize_bootstrap_validator_signup(signup_with_redirect);
        if (show_modal) {
            $('#modal-signup-root').modal('show');
        }
    });
};

function initialize_login_form_signup_link() {
    $('#login-form-signup-link').on('click', function () {
        $('#modal-login-root').modal('hide');
        load_signup_modal(true);
    });
};

$(document).ready(function ($) {
    'use strict';

    $('.contact-form-button').on('click', function () {
        // If the modal content has already been loaded, don't do it again
        if ($('#modal-contact-form-content').children().length > 0) {
            return;
        }
        $.get(window.additional_parameters.contact_form_url, function (data) {
            $('#modal-contact-form-content').html(data);
            initialize_bootstrap_validator_contact();
        });
    });

    $('.signup-form-button').on('click', function () {
        load_signup_modal(false); // The show_modal parameter is false because we can expect the data attributes
                                  // in the HTML to handle it for us
    });

    $('.login-form-button').on('click', function () {
        load_login_modal(false);  // The show_modal parameter is false because we can expect the data attributes
                                  // in the HTML to handle it for us
    });

    $('.submit-ticket-form-button').on('click', function () {

        if (!window.additional_parameters.is_authenticated) {
            load_login_modal(true);
            return;
        }

        var $modal_submit_ticket_form_content = $('#modal-submit-ticket-form-content');

        // If the modal content has already been loaded, don't do it again
        if ($modal_submit_ticket_form_content.children().length > 0) {
            $('#modal-submit-ticket-root').modal('show');
            return;
        }

        $.get(window.additional_parameters.submit_ticket_url, function (data) {
            $modal_submit_ticket_form_content.html(data);
            initialize_bootstrap_validator_submit_ticket();

            // Initialize when the submit-ticket forms loads in addition to when the main page loads.
            // Seeing as the location input box in the ticket submission form won't exists when the page loads,
            // we need to call this initialization function twice.
            initialize_location_autocomplete();

            // We cannot kick this off using HTML data attributes because we need to check if the user is logged in
            // first.
            $('#modal-submit-ticket-root').modal('show');
        });
    });

    // search-submit button
    $('#search-ticket-submit').on('click', function () {
        if (!window.additional_parameters.is_authenticated) {
            load_login_modal(true);
            return false; // block the form submission
        }

        // hack: copied from the above function (submit ticket).
        //
        var $modal_submit_ticket_form_content = $('#modal-submit-ticket-form-content');

        // If the modal content has already been loaded, don't do it again
        if ($modal_submit_ticket_form_content.children().length > 0) {
            $('#modal-submit-ticket-root').modal('show');
            return false;  // block the form submission
        }
    });
   
    // search-input-box
    if (!window.additional_parameters.is_authenticated) {

        $('#search-ticket-input').on('click', function () {
            load_login_modal(true);
            return false; // block the form submission
        });
    }
    else
    {
        initialize_date_pickers();
        prepare_ticket_search_dropdown();

        // Initialize when the page loads so that ticker search autocomplete woks
        initialize_location_autocomplete();
    }
}($));