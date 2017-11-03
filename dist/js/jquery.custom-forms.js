/**
 * Created by Michał on 08.02.2017.
 */

(function($){

    var defaults = {
        customSelect: true,
        customCheckbox: true,
        useMask: true,
        keyMapping: true,
        validation: true,
        errorContainer: 'span.error',
        stepForm: {
            active: false,
            dynamicValidation: true,
            slideToTop:true,
            stepSelector: '.step',
            nextSelector: '.next-step',
            prevSelector: '.prev-step',
            dynamicHeight: false,
            onNextStep: function($form, $step, old_step, new_step){

            },
            onPrevStep: function($form, $step, old_step, new_step){

            },
            onStepValidation: function($form, $step, step_id, valid){

            }
        },
        fileUpload: {
            active: false,
            containerSelector: '.upload_container',
            listSelector: '.list_of_files',
            browseSelector: '.add_next_file',
            apiUrl: '',
            onFileAdded: function($form, file){

            },
            onFileDeleted: function($form, file){

            }
        },
        onSubmit: function(event, $element){

        },
        onInputValidation: function($form, $element, valid){

        },
        onFormValidation: function($form, valid){

        },
        onInit: function($form){

        }
    };

    $.fn.customForm = function(options){
        var $form;
        var globalOptions;
        var formElements = null;
        var stepsCount = 0;
        var steps = null;
        var currentStep = 0;
        var jump = 0;
        var $stepsWrap = null;

        var uploader = null;
        var uploaded = false;
        var up_cont_id = null;
        var up_add_id = null;
        var up_list_id = null;

        var randomString = function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < 7; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        };

        /* Initialization functions */
        var initOptions = function(options){
            globalOptions = $.extend({}, defaults, options);
            if(typeof globalOptions.stepForm == "boolean") {
                var active = globalOptions.stepForm;
                globalOptions.stepForm = {
                    active: active,
                    dynamicValidation: true,
                    slideToTop:true,
                    stepSelector: '.step',
                    nextSelector: '.next-step',
                    prevSelector: '.prev-step',
                    dynamicHeight: false,
                    onNextStep: function($form, $step, old_step, new_step){

                    },
                    onPrevStep: function($form, $step, old_step, new_step){

                    },
                    onStepValidation: function($form, $step, step_id, valid){

                    }
                }
            } else {
                globalOptions.stepForm = $.extend({}, defaults.stepForm, globalOptions.stepForm);
            }
            if(typeof globalOptions.fileUpload == "boolean") {
                var active2 = globalOptions.fileUpload;
                globalOptions.fileUpload = {
                    active: active2,
                    containerSelector: '.upload_container',
                    listSelector: '.list_of_files',
                    browseSelector: '.add_next_file',
                    apiUrl: '',
                    onFileAdded: function($form, file){

                    },
                    onFileDeleted: function($form, file){

                    }
                }
            } else {
                globalOptions.fileUpload = $.extend({}, defaults.fileUpload, globalOptions.fileUpload);
            }
        };
        var initCustomSelect = function($el){
            $el.wrap('<div class="custom-form-select" style="position: relative;"></div>');
            var name = $el.attr('name');
            var options = $el.find('option');
            var $parent = $el.parent();
            var $input = $('<input/>').attr('type', 'hidden').attr('name', name).attr('value', '');
            var place = $el.attr('placeholder');
            if(typeof place === "undefined") place = 'Wybierz';
            var $select = $('<a></a>').attr('href', '').append($('<span></span>').html(place)).append($('<i></i>').addClass('fa fa-chevron-down')).on('click', function(e){e.preventDefault();});
            var $ul = $('<ul style="position: absolute; bottom: 0; top: 100%;"></ul>');
            $.each(options, function(){
                var val = $(this).attr('value');
                var text = $(this).html();
                var $li = $('<li></li>').attr('data-value', val).html(text).on('click', customSelectOptionClick);
                $ul.append($li);
            });
            $parent.append($select).append($ul).append($input);
            $parent.on('click', customSelectTriggerClick);
            $parent.on('mouseleave', customSelectTriggerLeave);


            if(globalOptions.validation){
                var data_validation = $el.attr('data-validation');
                var validation_error = $el.attr('data-validation-error');
                if(data_validation != 'undefined'){
                    $parent.attr('data-validation', data_validation);
                    $parent.addClass('custom-form-validated');
                    if(validation_error != 'undefined') $parent.attr('data-validation-error', validation_error);
                    $input.on('change', function(e){
                        validateInput(e, $(this));
                        if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                            validateStep($step);
                        }
                    });
                }
            }

            $el.remove();
        };
        var initCustomCheckbox = function($el){
            var type = $el.attr('data-checkbox-type');
            var group = $el.attr('data-checkbox-group');
            var itype = $el.attr('type');
            if(typeof type === 'undefined') type = 'normal';
            if(typeof group === 'undefined') group = null;

            if(type == 'box'){
                var $container;
                var name;
                var $label = $form.find('label[for="'+$el.attr('id')+'"]');
                if(group){
                    var $gr = $form.find('[data-group="'+group+'"]');
                    if($gr.length == 0) {
                        $el.wrap('<div class="custom-form-checkbox type-'+itype+'" data-group="'+group+'"></div>');
                        $container = $el.parent();
                    }else{
                        $container = $gr;
                    }
                    name = group;
                }else{
                    $el.wrap('<div class="custom-form-checkbox type-'+itype+'"></div>');
                    $container = $el.parent();
                    name = $el.attr('name');
                }
                var $check = $('<a></a>').addClass('checkbox').attr('href', '').attr('data-value', $el.val()).html($label.html()).on('click', customCheckboxClick);
                var $input = $('<input/>').attr('type', 'hidden').attr('name', name).attr('value', '');

                $container.append($check);
                var $in = $container.find('input[type="hidden"]');
                if($in.length == 0) $container.append($input);

                if(globalOptions.validation){
                    var data_validation = $el.attr('data-validation');
                    var validation_error = $el.attr('data-validation-error');

                    if(typeof data_validation !== 'undefined'){
                        $container.attr('data-validation', data_validation);
                        $container.addClass('custom-form-validated');
                        if(typeof validation_error !== 'undefined') $container.attr('data-validation-error', validation_error);
                        $input.on('change', function (e) {
                            validateInput(e, $(this));
                            if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                                var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                                validateStep($step);
                            }
                        });
                    }
                }

                $el.remove();
                $label.remove();

            }else{
                if(globalOptions.validation){
                    var data_validation = $el.attr('data-validation');
                    if(typeof data_validation !== 'undefined'){
                        $el.addClass('custom-form-validated');
                        $el.on('change', function(){
                            var group = $(this).attr('name');
                            var res = true;
                            if(typeof group !== 'undefined') {
                                var rtt = false;
                                var checks = $form.find('[name="'+group+'"]');
                                $.each(checks, function(){
                                    if($(this).is(':checked')) rtt = true;
                                });
                                res = rtt;
                            }else{
                                res = ($(this).is(':checked'));
                            }
                            if(res){
                                $(this).addClass('validation-ok');
                                $(this).removeClass('validation-error');
                            }
                            else {
                                $(this).removeClass('validation-ok');
                                $(this).addClass('validation-error');
                            }

                            if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                                var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                                validateStep($step);
                            }
                        })
                    }
                }
            }


        };
        var initValidationInput = function($el){
            var data_validation = $el.attr('data-validation');
            if(typeof data_validation != 'undefined'){
                $el.wrap('<div class="input-group custom-form-validated"></div>');

                var $cont = $el.parent();

                var validations = [];
                validations = data_validation.split(/\s/);

                if(validations.length > 0){
                    $cont.append($('<span></span>').addClass('input-group-addon').append('<i class="fa fa-check"></i><i class="fa fa-close"></i>'));

                    if($.inArray('phone', validations) != -1){
                        $cont.prepend($('<span></span>').addClass('input-group-addon prefix').html('+48'));
                        if(globalOptions.useMask) $el.mask('999-999-999');
                    }
                    if($.inArray('post', validations) != -1){
                        if(globalOptions.useMask) $el.mask('99-999');
                    }

                    $el.on('change, focusout', function(e){
                        validateInput(e, $(this));
                        if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                            validateStep($step);
                        }
                    });
                    $el.on('keyup',  function(e){
                        validateInput(e, $(this));
                        if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                            validateStep($step);
                        }
                    });
                }
            }
        };
        var initValidationTextarea = function($el){
            var data_validation = $el.attr('data-validation');
            if(typeof data_validation != 'undefined'){
                $el.wrap('<div class="input-group custom-form-validated"></div>');

                var $cont = $el.parent();

                var validations = [];
                validations = data_validation.split(/\s/);

                if(validations.length > 0){
                    $cont.append($('<span></span>').addClass('input-group-addon').append('<i class="fa fa-check"></i><i class="fa fa-close"></i>'));

                    $el.on('change, focusout', function(e){
                        validateTextarea(e, $(this));
                        if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                            validateStep($step);
                        }
                    });
                    $el.on('keyup',  function(e){
                        validateTextarea(e, $(this));
                        if(globalOptions.stepForm.active && globalOptions.stepForm.dynamicValidation){
                            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
                            validateStep($step);
                        }
                    });
                }
            }
        };
        var initStepForm = function(){
            steps = $form.find(globalOptions.stepForm.stepSelector);
            stepsCount = steps.length;
            jump = 100.0 / parseFloat(stepsCount);
            $form.addClass('step-form-wrap').css({
                "overflow": "hidden",
                "width": "100%"
            });
            var $wrap = $('<div></div>').addClass('step-form').css({
                "width": 100*stepsCount+"%",
                "display": "block",
                "transform": "translate(0, 0)",
                "transition": "600ms"
            });
            steps.wrapAll($wrap);
            $stepsWrap = $form.find('.step-form');
            $.each(steps, function(){
                $(this).css({
                    "width": jump+"%",
                    "display": "block",
                    "float": "left"
                });
            });

            $form.find(globalOptions.stepForm.nextSelector).on('click', nextStepClick);
            $form.find(globalOptions.stepForm.prevSelector).on('click', prevStepClick);
        };
        var initFileUpload = function(){
            var $cont = $form.find(globalOptions.fileUpload.containerSelector);
            var $list = $cont.find(globalOptions.fileUpload.listSelector);
            var $add = $cont.find(globalOptions.fileUpload.browseSelector);
            up_cont_id = 'fucont-'+randomString();
            up_add_id = 'fuadd-'+randomString();
            up_list_id = 'fulist-'+randomString();
            $cont.attr('id',up_cont_id );
            $list.attr('id', up_list_id);
            $add.attr('id', up_add_id);

            uploader = new plupload.Uploader({
                runtimes : 'html5,flash,silverlight,html4',
                browse_button: up_add_id, // you can pass an id...
                container: document.getElementById(up_cont_id), // ... or DOM Element itself
                url : globalOptions.fileUpload.apiUrl,
                flash_swf_url : '/assets/js/Moxie.swf',
                silverlight_xap_url : '/assets/js/Moxie.xap',

                filters : {
                    max_file_size : '10mb',
                    mime_types: [
                        {title : "Image files", extensions : "jpg,gif,png"},
                        {title : "Zip files", extensions : "zip"},
                        {title : "Documents", extensions: "pdf"}
                    ]
                },
                preinit: {
                    Init: function(up, info){
                        console.log('[Init]', info);
                    },
                    UploadFile: function(up, file) {
                        console.log('[UploadFile]', file);
                    }
                },
                init: {
                    PostInit: function() {
                        console.log('[PostInit]');
                        document.getElementById(up_list_id).innerHTML = '';
                    },
                    Browse: function(up) {
                        console.log('[Browse]');
                    },
                    Refresh: function(up) {
                        console.log('[Refresh]');
                    },
                    StateChanged: function(up) {
                        console.log('[StateChanged]', up.state == plupload.STARTED ? "STARTED" : "STOPPED");
                    },
                    QueueChanged: function(up) {
                        console.log('[QueueChanged]');
                    },
                    OptionChanged: function(up, name, value, oldValue) {
                        console.log('[OptionChanged]', 'Option Name: ', name, 'Value: ', value, 'Old Value: ', oldValue);
                    },
                    BeforeUpload: function(up, file) {
                        console.log('[BeforeUpload]', 'File: ', file);
                    },
                    UploadProgress: function(up, file) {
                       console.log('[UploadProgress]', 'File:', file, "Total:", up.total);;
                    },
                    FileFiltered: function(up, file) {
                        console.log('[FileFiltered]', 'File:', file);
                    },
                    FilesAdded: function(up, files) {
                        console.log('[FilesAdded]');
                        plupload.each(files, function(file) {
                            document.getElementById(up_list_id).innerHTML += '<li id="' + file.id + '"><input type="hidden" value="' + file.name + '" name="files[]" /><span>' + file.name + '</span><button data-id="' + file.id + '" class="remove">usuń</button></li>';
                        });
                        globalOptions.fileUpload.onFileAdded($form, files);
                    },
                    FilesRemoved: function(up, files) {
                        console.log('[FilesRemoved]');
                    },
                    FileUploaded: function(up, file, info) {
                        console.log('[FileUploaded] File:', file, "Info:", info);
                    },
                    ChunkUploaded: function(up, file, info) {
                        console.log('[ChunkUploaded] File:', file, "Info:", info);
                    },
                    UploadComplete: function(up, file) {
                        console.log('[UploadComplete]');
                        uploaded = true;
                        $form.submit();
                    },
                    Destroy: function(up) {
                        // Called when uploader is destroyed
                        console.log('[Destroy]');
                    },
                    Error: function(up, err) {
                        console.log(err, up);
                    }
                }
            });
            uploader.init();
            $list.on('click', 'button.remove', function(e) {
                e.preventDefault();
                var id = $(this).attr('data-id');
                uploader.removeFile(uploader.getFile(id));
                $('#'+id).remove();
                globalOptions.fileUpload.onFileDeleted($form, uploader.getFile(id));
            });
        };

        /* Element triggers */
        var customCheckboxClick = function (e) {
            e.preventDefault();
            var $cont = $(this).parent();
            var $el = $(this);
            var $input = $cont.find('input[type="hidden"]');

            var type = ($cont.hasClass('type-checkbox')) ? 'checkbox' : 'radio';
            var value = $el.attr('data-value');

            if($el.hasClass('checked')) {
                if(type == 'checkbox'){
                    $el.removeClass('checked');
                    var val = $input.attr('value');
                    if(val != ''){
                        val = val.split(',');
                        var i = val.indexOf(value);
                        if(i > -1){
                            val.splice(i, 1);
                        }
                        val = val.join(',');
                    }
                    $input.attr('value', val);
                    $input.trigger('change');
                }
            } else {
                if(type == 'radio'){
                    var checks = $cont.find('.checkbox');
                    checks.removeClass('checked');
                }
                $el.addClass('checked');
                if(type == 'radio'){
                    $input.attr('value', value);
                }else{
                    var val = $input.attr('value');
                    if(val != ''){
                        val = val.split(',');
                        val.push(value);
                        val = val.join(',');
                    } else val = value;
                    $input.attr('value', val);
                }
                $input.trigger('change');
            }

        };
        var customSelectOptionClick = function(e){
            e.preventDefault();
            var val = $(this).attr('data-value');
            var txt = $(this).html();
            var $parent = $(this).parent().parent();
            if(val != '') $parent.addClass('selected');
            else $parent.removeClass('selected');

            // var $ul = $parent.find('ul');
            // $ul.css({"bottom": "0px"});
            // $parent.removeClass('opened');

            $parent.find('a').find('span').html(txt);
            $parent.find('input[type="hidden"]').val(val).trigger('change');


        };
        var customSelectTriggerClick = function(e){
            e.preventDefault();
            var $ul = $(this).find('ul');
            if(!$(this).hasClass('opened')) {
                var h = 0;
                $ul.find('li').each(function () {
                    h += $(this).outerHeight(true);
                });
                $ul.css({"bottom": "-" + h + "px"});
                $(this).addClass('opened');
            }
            else{
                $ul.css({"bottom": "0px"});
                $(this).removeClass('opened');
            }
        };
        var customSelectTriggerLeave = function(e){
            e.preventDefault();
            var $ul = $(this).find('ul');
            $ul.css({"bottom": "0px"});
            $(this).removeClass('opened');
        };
        var nextStepClick = function(e){
            e.preventDefault();
            var valid = true;
            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
            if(globalOptions.validation){
                valid = validateStep($step);
            }
            if(valid){
                currentStep++;
                var newX = parseFloat(currentStep)*jump;
                if(globalOptions.stepForm.dynamicHeight) {
                    var $nstep = $form.find('[form-step="'+currentStep+'"]');
                    var height = $nstep.attr('form-height');
                    $nstep.css({'height': height});
                    $.each(steps, function(){
                        var step = $(this).attr('form-step');
                        if(step != currentStep){
                            $(this).css({"height": height});
                        }
                    });
                }
                $stepsWrap.css({
                    "transform": "translate(-"+ newX +"%, 0)"
                });
                if(globalOptions.stepForm.slideToTop) {
                    $('body').scrollTo($form.offset().top - 180, 500);
                }
                if(globalOptions.fileUpload.active){
                    uploader.refresh();
                }
                globalOptions.stepForm.onNextStep($form, $step, currentStep-1, currentStep);
            }
        };
        var prevStepClick = function(e){
            e.preventDefault();
            var $step = $(this).closest(globalOptions.stepForm.stepSelector);
            currentStep--;
            if(globalOptions.stepForm.dynamicHeight) {
                var $nstep = $form.find('[form-step="'+currentStep+'"]');
                var height = $nstep.attr('form-height');
                $nstep.css({'height': height});
                $.each(steps, function(){
                    var step = $(this).attr('form-step');
                    if(step != currentStep){
                        $(this).css({"height": height});
                    }
                });
            }
            $stepsWrap.css({
                "transform": "translate(-"+ parseFloat(currentStep)*jump +"%, 0)"
            });
            if(globalOptions.stepForm.slideToTop) {
                $('body').scrollTo($form.offset().top - 180, 500);
            }
            globalOptions.stepForm.onPrevStep($form, $step, currentStep+1, currentStep);
        };

        /* Element validators */
        var validateInput = function(event, $element){
            var $container = $element.closest('.custom-form-validated');
            if($container.length == 0) $container = $element;

            var type = $element.attr('type');
            if($.inArray(type, ['text', 'hidden', 'email']) != -1){
                var val = $element.val();
                var data_validation;
                if(type == 'text' || type == 'email') data_validation = $element.attr('data-validation');
                else data_validation = $container.attr('data-validation');

                var validations = data_validation.split(/\s/);

                if(validations.length > 0){
                    var res = true;
                    $.each(validations, function(key, value){
                        var r = true;
                        switch(value){
                            case 'required': r = validateRequired(val); break;
                            case 'phone': r = validatePhone(val); break;
                            case 'email': r = validateEmail(val); break;
                            case 'alphanumeric': r = validateAlphanumeric(val); break;
                            case 'post': r = validatePost(val); break;
                            default: r = true;
                        }
                        if(!r) res = false;
                    });

                    if(res){
                        $container.addClass('validation-ok');
                        $container.removeClass('validation-error');
                    }else{
                        $container.removeClass('validation-ok');
                        $container.addClass('validation-error');
                    }
                    globalOptions.onInputValidation($form, $element, res);
                }
            }

        };
        var validateTextarea = function(event, $element){
            var $container = $element.closest('.custom-form-validated');
            if($container.length == 0) $container = $element;

            var val = $element.val();
            var data_validation;
            data_validation = $element.attr('data-validation');

            var validations = data_validation.split(/\s/);

            if(validations.length > 0){
                var res = true;
                $.each(validations, function(key, value){
                    var r = true;
                    switch(value){
                        case 'required': r = validateRequired(val); break;
                        default: r = true;
                    }
                    if(!r) res = false;
                });

                if(res){
                    $container.addClass('validation-ok');
                    $container.removeClass('validation-error');
                }else{
                    $container.removeClass('validation-ok');
                    $container.addClass('validation-error');
                }
                globalOptions.onInputValidation($form, $element, res);
            }

        };
        var validateFields = function(fields){
            var res = true;
            $.each(fields, function(){
                var tag = $(this).prop('tagName').toLowerCase();
                var $input;
                if(tag != 'input' && tag != 'textarea') {
                    $input = $(this).find('input');
                    if($input.length == 0) $input = $(this).find('textarea');
                }
                else $input = $(this);

                var val = $input.val();
                var data_validation;
                var type;
                if($input.prop('tagName').toLowerCase() != 'textarea') {
                    type = $input.attr('type');
                    if (type == 'text' || type == 'email') data_validation = $input.attr('data-validation');
                    else data_validation = $(this).attr('data-validation');
                } else{
                    type = 'text';
                    data_validation = $input.attr('data-validation');
                }

                var validations = data_validation.split(/\s/);

                if (validations.length > 0) {
                    var rt = true;
                    if (type != 'checkbox') {
                        $.each(validations, function (key, value) {
                            var r = true;
                            switch (value) {
                                case 'required':
                                    r = validateRequired(val);
                                    break;
                                case 'phone':
                                    r = validatePhone(val);
                                    break;
                                case 'email':
                                    r = validateEmail(val);
                                    break;
                                case 'alphanumeric':
                                    r = validateAlphanumeric(val);
                                    break;
                                case 'post':
                                    r = validatePost(val);
                                    break;
                                default:
                                    r = true;
                            }
                            if (!r) rt = false;
                        });
                    } else {
                        var group = $(this).attr('name');
                        if (typeof group !== 'undefined') {
                            var rtt = false;
                            var checks = $form.find('[name="' + group + '"]');
                            $.each(checks, function () {
                                if ($(this).is(':checked')) rtt = true;
                            });
                            rt = rtt;
                        } else {
                            rt = ($(this).is(':checked'));
                        }
                    }
                    if (rt) {
                        $(this).addClass('validation-ok');
                        $(this).removeClass('validation-error');
                    } else {
                        res = false;
                        $(this).removeClass('validation-ok');
                        $(this).addClass('validation-error');
                    }
                }
            });
            return res;
        };
        var validateStep = function($step){
            var validates = $step.find('.custom-form-validated');
            var res = validateFields(validates);
            globalOptions.stepForm.onStepValidation($form, $step, currentStep, res);
            return res;
        };
        var validateForm = function(){
            var validates = $form.find('.custom-form-validated');
            var res = validateFields(validates);
            globalOptions.onFormValidation($form, res);
            return res;
        };

        /* String Validators */
        var validateRequired = function(value){
            return value.match(/^.+$/);
        };
        var validatePhone = function(value){
            if(value == '') return true;
            value = value.replace(/(\-|\s)/gi,'');
            matches = value.match(/^[0-9]{9}$/);
            return matches;
        };
        var validateEmail = function(value){
            if(value == '') return true;
            return value.match(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/);
        };
        var validateAlphanumeric = function(value) {
            if(value == '') return true;
            return value.match(/^([A-ZĘÓĄŚŁŻŹĆŃa-zęóąśłżźćń0-9\s\-\/\.]+)$/);
        };
        var validatePost = function(value) {
            if(value == '') return true;
            value = value.replace(/(\-|\s)/gi,'');
            matches = value.match(/^[0-9]{5}$/);
            return matches;
        };

        var init = function(){
            $form.addClass('custom-form');
            formElements = $form.find('input, select, textarea');
            $.each(formElements, function(){
                var $el = $(this);
                var tag = $el.prop('tagName').toLowerCase();
                var type = (tag == 'input') ? $el.attr('type') : 'not-needed';
                if(globalOptions.validation) {
                    $el.removeAttr('required');
                    $el.attr('autocomplete', 'off');
                }
                if(tag == 'select' && globalOptions.customSelect){
                    initCustomSelect($el);
                }
                if(tag == 'input' && (type == 'checkbox' || type == 'radio') && globalOptions.customCheckbox){
                    initCustomCheckbox($el);
                }
                if(globalOptions.validation && tag == 'input' && $.inArray(type, ['text', 'email']) != -1){
                    initValidationInput($el);
                }
                if(globalOptions.validation && tag == 'textarea'){
                    initValidationTextarea($el);
                }
            });
            if(globalOptions.stepForm.active){
                initStepForm();
            }
            if(globalOptions.fileUpload.active){
                initFileUpload();
                // console.log(uploader);
            }
            $form.on('submit', function(e){
                var res = true;
                if(globalOptions.validation){
                    res = validateForm();
                }
                if(res){
                    if(globalOptions.fileUpload.active){
                        if(uploaded == false){
                            e.preventDefault();
                            uploader.start();
                        } else{
                            globalOptions.onSubmit(e, $form);
                        }
                    }else{
                        globalOptions.onSubmit(e, $form);
                    }
                }else{
                    e.preventDefault();
                    console.log('zle!');
                }
            });
            if(globalOptions.fileUpload.active){
                // uploader.init();
                // console.log(uploader);
            }
            globalOptions.onInit();
        };

        if(this.length > 0) {
            if(this.length > 1) {
                this.each(function(){
                   $(this).customForm(options);
                });
            } else {
                initOptions(options);
                $form = this;
                init();

                $(window).on('load', function(){
                    var stp = $form.find(globalOptions.stepForm.stepSelector);
                    $.each(stp, function(){
                        var height = $(this).outerHeight();
                        $(this).attr('form-height', height);
                    });
                    if(globalOptions.stepForm.dynamicHeight){
                        var $first = $form.find('[form-step="0"]');
                        var height = $first.attr('form-height');
                        $.each(stp, function(){
                            var step = $(this).attr('form-step');
                            if(step != 0){
                                $(this).css({"height": height});
                            }
                        });
                    }
                });

            }
        }
    }
})(jQuery);