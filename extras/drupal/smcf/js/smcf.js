// make sure jQuery is loaded
if (typeof jQuery !== "undefined" && typeof jQuery.modal !== "undefined") {
  jQuery(document).ready(function () {
    var smcf_url = jQuery('#smcf-content form').attr('action');
    jQuery('.smcf-link' + Drupal.settings.smcf.selector).click(function (e) { // added .smcf_link for previous version
      e.preventDefault();
      // display the contact form
      jQuery('#smcf-content').modal({
        close: false,
        overlayId: 'smcf-overlay',
        containerId: 'smcf-container',
        onOpen: contact.open,
        onShow: contact.show,
        onClose: contact.close
      });
    });

    // preload images
    var img = ['cancel.png','form_bottom.gif','form_top.gif','form_top_ie.gif','loading.gif','send.png'];
    jQuery(img).each(function () {
      var i = new Image();
      i.src = Drupal.settings.smcf.images_url + this;
    });
  });

  var contact = {
    message: null,
    open: function (dialog) {
      // dynamically determine height
      var h = 250;
      if (jQuery('#smcf-subject').length) {
        h += 26;
      }
      if (jQuery('#smcf-cc').length) {
        h += 22;
      }

      // resize the textarea for safari
      if (jQuery.browser.safari) {
        jQuery('#smcf-container .smcf-input').css({
          'font-size': '.9em'
        });
      }

      // add padding to the buttons in firefox/mozilla
      if (jQuery.browser.mozilla) {
        jQuery('#smcf-container .smcf-button').css({
          'padding-bottom': '2px'
        });
      }

      var title = jQuery('#smcf-container .smcf-title').html();
      jQuery('#smcf-container .smcf-title').html(Drupal.settings.smcf.messages.loading);
      dialog.overlay.fadeIn(200, function () {
        dialog.container.fadeIn(200, function () {
          dialog.data.fadeIn(200, function () {
            jQuery('#smcf-container .smcf-content').animate({
              height: h
            }, function () {
              jQuery('#smcf-container .smcf-title').html(title);
              jQuery('#smcf-container form').fadeIn(200, function () {
                jQuery('#smcf-container #smcf-name').focus();

                jQuery('#smcf-container .smcf-cc').click(function () {
                  var cc = jQuery('#smcf-container #smcf-cc');
                  cc.is(':checked') ? cc.attr('checked', '') : cc.attr('checked', 'checked');
                });

                // fix png's for IE 6
                if (jQuery.browser.msie && jQuery.browser.version < 7) {
                  jQuery('#smcf-container .smcf-button').each(function () {
                    if (jQuery(this).css('backgroundImage').match(/^url[("']+(.*\.png)[)"']+$/i)) {
                      var src = RegExp.$1;
                      jQuery(this).css({
                        backgroundImage: 'none',
                        filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' +  src + '", sizingMethod="crop")'
                      });
                    }
                  });
                }
              });
            });
          });
        });
      });
    },
    show: function (dialog) {
      jQuery('#smcf-container .smcf-send').click(function (e) {
        e.preventDefault();

        // validate form
        if (contact.validate()) {
          jQuery('#smcf-container .smcf-message').fadeOut(function () {
            jQuery('#smcf-container .smcf-message').removeClass('smcf-error').empty();
          });
          jQuery('#smcf-container .smcf-title').html(Drupal.settings.smcf.messages.sending);
          jQuery('#smcf-container form').fadeOut(200);
          jQuery('#smcf-container .smcf-content').animate({
            height: '80px'
          }, function () {
            jQuery('#smcf-container .smcf-loading').fadeIn(200, function () {
              jQuery.ajax({
                url: jQuery('#smcf-content form').attr('action'),
                data: jQuery('#smcf-container form').serialize() + '&action=send',
                type: 'post',
                cache: false,
                dataType: 'html',
                success: function (data) {
                  jQuery('#smcf-container .smcf-loading').fadeOut(200, function () {
                    jQuery('#smcf-container .smcf-title').html(Drupal.settings.smcf.messages.thankyou);
                    jQuery('#smcf-container .smcf-message').html(data).fadeIn(200);
                  });
                },
                error: function (xhr) {
                  jQuery('#smcf-container .smcf-loading').fadeOut(200, function () {
                    jQuery('#smcf-container .smcf-title').html(Drupal.settings.smcf.messages.error);
                    jQuery('#smcf-container .smcf-message').html(xhr.status + ': ' + xhr.statusText).fadeIn(200);
                  });
                }
              });
            });
          });
        }
        else {
          if (jQuery('#smcf-container .smcf-message:visible').length > 0) {
            var msg = jQuery('#smcf-container .smcf-message div');
            msg.fadeOut(200, function () {
              msg.empty();
              contact.showError();
              msg.fadeIn(200, function () {
                contact.showValidationErrors();  
              });
            });
          }
          else {
            jQuery('#smcf-container .smcf-message').animate({
              height: '30px'
            }, function () {
              contact.showError();
              contact.showValidationErrors();
            });
          }
        }
      });
    },
    close: function (dialog) {
      jQuery('#smcf-container .smcf-message').fadeOut();
      jQuery('#smcf-container .smcf-title').html(Drupal.settings.smcf.messages.goodbye);
      jQuery('#smcf-container form').fadeOut(200);
      jQuery('#smcf-container .smcf-content').animate({
        height: '40px'
      }, function () {
        dialog.data.fadeOut(200, function () {
          dialog.container.fadeOut(200, function () {
            dialog.overlay.fadeOut(200, function () {
              jQuery.modal.close();
            });
          });
        });
      });
    },
    validate: function () {
      contact.message = '';
      contact.errors = [];

      // clear the validation errors
      jQuery('.smcf-validation-error').removeClass('smcf-validation-error');

      var name = jQuery('#smcf-container #smcf-name');
      if (!jQuery.trim(name.val())) {
        contact.message += Drupal.settings.smcf.messages.namerequired + " ";
        contact.errors.push('#smcf-container #smcf-name');
      }

      var email = jQuery('#smcf-container #smcf-email');
      if (!jQuery.trim(email.val())) {
        contact.message += Drupal.settings.smcf.messages.emailrequired + " ";
        contact.errors.push('#smcf-container #smcf-email');
      }
      else {
        if (!contact.validateEmail(email.val())) {
          contact.message += Drupal.settings.smcf.messages.emailinvalid + " ";
          contact.errors.push('#smcf-container #smcf-email');
        }
      }

      var message = jQuery('#smcf-container #smcf-message');
      if (!jQuery.trim(message.val())) {
        contact.message += Drupal.settings.smcf.messages.messagerequired;
        contact.errors.push('#smcf-container #smcf-message');
      }

      if (contact.message.length > 0) {
        return false;
      }
      else {
        return true;
      }
    },
    validateEmail: function (email) {
      var at = email.lastIndexOf("@");

      // Make sure the at (@) sybmol exists and  
      // it is not the first or last character
      if (at < 1 || (at + 1) === email.length)
        return false;

      // Make sure there aren't multiple periods together
      if (/(\.{2,})/.test(email))
        return false;

      // Break up the local and domain portions
      var local = email.substring(0, at);
      var domain = email.substring(at + 1);

      // Check lengths
      if (local.length < 1 || local.length > 64 || domain.length < 4 || domain.length > 255)
        return false;

      // Make sure local and domain don't start with or end with a period
      if (/(^\.|\.$)/.test(local) || /(^\.|\.$)/.test(domain))
        return false;

      // Check for quoted-string addresses
      // Since almost anything is allowed in a quoted-string address,
      // we're just going to let them go through
      if (!/^"(.+)"$/.test(local)) {
        // It's a dot-string address...check for valid characters
        if (!/^[-a-zA-Z0-9!#$%*\/?|^{}`~&'+=_\.]*$/.test(local))
          return false;
      }

      // Make sure domain contains only valid characters and at least one period
      if (!/^[-a-zA-Z0-9\.]*$/.test(domain) || domain.indexOf(".") === -1)
        return false;  

      return true;
    },
    showError: function () {
      jQuery('#smcf-container .smcf-message')
        .html(jQuery('<div/>').addClass('smcf-error').append(contact.message))
        .fadeIn(200);
    },
    showValidationErrors: function () {
      jQuery.each(contact.errors, function (i, el) {
        jQuery(el).addClass('smcf-validation-error');
      });
    }
  };
}