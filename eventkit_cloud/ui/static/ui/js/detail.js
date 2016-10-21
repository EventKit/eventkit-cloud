exports = {}
exports.detail = (function(){
    var map;
    var job_extents_source;

    return {
        init: function(){
            parts = window.location.href.split('/');
            var job_uid = parts[parts.length -2];
            exports.detail.job_uid = job_uid;
            exports.detail.timer = false;
            initMap();
            initPopovers();
            loadJobDetail();
            loadSubmittedRunDetails();
            loadCompletedRunDetails();
            //loadFailedRunDetails();
        },
    }

    /**
     * Initialize the export overview map.
     */
    function initMap(){
        // maxExtent = new OpenLayers.Bounds(-180,-90,180,90).transform("EPSG:4326", "EPSG:3857");
        // var mapOptions = {
        //         displayProjection: new OpenLayers.Projection("EPSG:4326"),
        //         controls: [new OpenLayers.Control.Attribution(),
        //                    new OpenLayers.Control.ScaleLine()],
        //         maxExtent: maxExtent,
        //         scales:[500000,350000,250000,100000,25000,20000,15000,10000,5000,2500,1250],
        //         units: 'm',
        //         sphericalMercator: true,
        //         noWrap: true // don't wrap world extents
        // }
        // map = new OpenLayers.Map('extents', {options: mapOptions});

        var osm = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        map = new ol.Map({
            target: 'extents',
            layers: [osm],
            view: new ol.View({
                projection: 'EPSG:3857',
                extent: [-20037508.34,-20037508.34, 20037508.34, 20037508.34],
                center: [0, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 18,
            })
        });

        // add base layers
        // osm = Layers.OSM
        // osm.options = {layers: "basic", isBaseLayer: true, visibility: true, displayInLayerSwitcher: true};
        // map.addLayer(osm);
        // map.zoomToMaxExtent();

        // job_extents = new OpenLayers.Layer.Vector('extents', {
        //     displayInLayerSwitcher: false,
        //     style: {
        //         strokeWidth: 3.5,
        //         strokeColor: '#D73F3F',
        //         fillColor: 'transparent',
        //         fillOpacity: 0.8,
        //     }
        // });

        // map.addLayer(job_extents);

        job_extents_source = new ol.source.Vector();

        var job_extents = new ol.layer.Vector({
            name: 'extents',
            source: job_extents_source,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#D73F3F',
                    width: 3.5
                })
            })
        });
        map.addLayer(job_extents);

        //map.restrictedExtent = map.getExtent();
        return map;
    }

    /**
     * Loads the job details.
     */
    function loadJobDetail(){
        var job_uid = exports.detail.job_uid;
        $.getJSON(Config.JOBS_URL + '/' + job_uid, function(data){
            // keep a reference to the job..
            exports.detail.job = data;
            $('#uid').html(data.uid);
            $('#name').html(data.name);
            $('#description').html(data.description);
            $('#event').html(data.event);
            //Not currently using the regions
            //region = data.region == undefined ? '': data.region.name;
            //if (region != "") {
            //   $('#region').html(region);
            //}
            $('#created_by').html(data.owner);
            var published = data.published ? 'Publicly' : 'Privately';
            $('#published').html(published);
            var created = moment(data.created_at).format('h:mm:ss a, MMMM Do YYYY');
            $('#created').html(created);
            var formats = data.exports;
            for (i = 0; i < formats[0].formats.length; i++){
                $('#formats').append(formats[0].formats[i].name + '<br/>');
            }

            // features
            var model = data.tags.length > 0 ? data.tags[0].data_model : null;

            switch (model){
                case 'HDM':
                    $('#osm-feature-tree').css('display','none');
                    $('#hdm-feature-tree').css('display','block');
                    $('#filelist').css('display', 'none');
                    initHDMFeatureTree(data.tags);
                    break;
                case 'OSM':
                    $('#hdm-feature-tree').css('display','none');
                    $('#osm-feature-tree').css('display','block');
                    $('#filelist').css('display', 'none');
                    initOSMFeatureTree(data.tags);
                    break;
                case 'PRESET':
                    $('#hdm-feature-tree').css('display','none');
                    $('#osm-feature-tree').css('display','none');
                    $('#filelist').css('display', 'block');
                    initPresetList(data.configurations);
                    break;
                default:
                    break;
            }

            // var extent = data.extent;
            // var geojson = new OpenLayers.Format.GeoJSON({
            //         'internalProjection': new OpenLayers.Projection("EPSG:3857"),
            //         'externalProjection': new OpenLayers.Projection("EPSG:4326")
            // });
            // var feature = geojson.read(extent, 'Feature');
            // job_extents.addFeatures(feature);

            var extent = data.extent;
            var geojson = new ol.format.GeoJSON();
            var feature = geojson.readFeature(extent, {
                'featureProjection': "EPSG:3857",
                'dataProjection': "EPSG:4326"
            });
            job_extents_source.addFeature(feature);

            //map.zoomToExtent(job_extents.getDataExtent());
            map.getView().fit(feature.getGeometry().getExtent(), map.getSize());
            // var bounds = feature.geometry.bounds.clone();
            // var area = bounds.transform('EPSG:3857', 'EPSG:4326').toGeometry().getGeodesicArea() / 1000000; // sq km
            // format the area and max bounds for display..
            var area = feature.getGeometry().getArea() / 1000000;
            var area_str = numeral(area).format('0,0');
            $('#extent').html(area_str + ' sq km');
            /*
             * Check for current user.
             * Display delete button if
             * current user matches the owner of the job.
             */
            var user = $('span#user').html();
            if (user === data.owner) {
                $('button#delete').css('display', 'block');
            }
            buildDeleteDialog();
            buildFeatureDialog();

        }).fail(function(jqxhr, textStatus, error) {
            if (jqxhr.status == 404) {
                $('#details-row').css('display', 'none');
                // display error info..
                $('#error-info').css('display', 'block');
            }
        });

        // handle re-run click events..
        $('button#rerun').bind('click', function(e){
            $(this).popover('hide');
            $.ajax({
                cache: false,
                url: Config.RERUN_URL + exports.detail.job_uid,
                success: function(data){
                    // initialize the submitted run panel immediately
                    initSumtittedRunPanel([data]);
                    // then start the check interval..
                    startRunCheckInterval();
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(jqXHR, textStatus, errorThrown);
                    if (jqXHR.status == 500 || jqXHR.status == 400) {
                        window.location.href = Config.CREATE_ERROR_URL;
                    }
                }
            })
        });

        // handle clone event
        $('button#clone').bind('click', function(e){
            window.location.href = '/exports/clone/' + exports.detail.job_uid;
        });
    }

    /**
     * Loads the completed run details.
     *
     * Parameters:
     * expand_first {Object} - whether to expand the first completed run.
     */
    function loadCompletedRunDetails(expand_first){
        var job_uid = exports.detail.job_uid;
        var $runPanel = $('#completed_runs > .panel-group');
        var url = Config.RUNS_URL + '?job_uid=' + job_uid
        $.ajax({
            cache: false,
            url: url,
            dataType: 'json',
            success: function(data){
                $runPanel.empty();
                // hide the submitted run panel
                if (!exports.detail.timer) {
                    $('#submitted_runs > .panel-group').empty();
                    $('#submitted_runs').css('display', 'none');
                }
                $.each(data, function(index, run) {
                    if (run.status == 'SUBMITTED') {
                        return;
                    } // ignore submitted runs
                    var started = moment(run.started_at).format('h:mm:ss a, MMMM Do YYYY');
                    var finished = moment(run.finished_at).format('h:mm:ss a, MMMM Do YYYY');
                    var duration = moment.duration(run.duration).humanize();
                    var status_class = '';
                    switch (run.status) {
                        case 'COMPLETED':
                            status_class = 'alert alert-success';
                            break;
                        case 'INCOMPLETE':
                            status_class = 'alert alert-warning';
                            break;
                        case 'FAILED':
                            status_class = 'alert alert-danger';
                            break;
                        default:
                            break;
                    }
                    var expanded = !exports.detail.timer && index === 0 ? 'in' : '';
                    var context = {
                        'run_uid': run.uid, 'status': run.status, 'user': run.user,
                        'started': started, 'finished': finished,
                        'duration': duration, 'status_class': status_class,
                        'expanded': expanded
                    };
                    var template = run.status == 'COMPLETED' || run.status == 'INCOMPLETE' ? getCompletedRunTemplate() : getFailedRunTemplate();
                    var html = template(context);
                    $runPanel.append(html);
                    // add data provider info
                    $providersDiv = $('div#' + run.uid).find('#providers');
                    var providers = run.provider_tasks;
                    $.each(providers, function (i, provider) {
                        var name = provider.name;
                        $providersDiv.append('<table width="100%"><tr id="' + provider.uid + '"><td><strong>' + name + '</strong></td></tr>');
                        // add task info

                        var taskDiv = '<div><table border=0 class="table table-condensed">';
                        var tasks = provider.tasks;
                        $.each(tasks, function (i, task) {
                            if (task.name != "OSMConf" && task.name != 'OSMSchema' && task.name != 'OverpassQuery' && task.name != 'WFSExport' && task.name != "ArcFeatureServiceExport") {
                                var errors = task.errors;
                                var result = task.result;
                                var status = task.status;
                                var duration = numeral(task.duration).format("HH:mm:ss.SSS");
                                var descriptiveName = task.name;
                                //var descriptiveName = 'Name Placeholder';
                                if (status === 'SUCCESS') {
                                    taskDiv += ('<tr><td><a href="' + result.url + '">' + descriptiveName + '</a></td><td>' + duration + '</td><td>' + result.size + '</td></tr>');
                                }

                                if (errors.length > 0) {
                                    $exceptions = $('tr#exceptions-' + run.uid);
                                    $exceptions.css('display', 'table-row');
                                    $errorsDiv = $runPanel.find('div#' + run.uid).find('#errors').find('table');
                                    $errorsDiv.append('<tr><td>' + task.name + '</td><td>' + task.errors[0].exception + '</td></tr>');
                                }
                            }
                        });
                        taskDiv+=('</table></div>');
                        $(taskDiv).appendTo('#providers');
                        $providersDiv.append('</table>')



                    });


                });
            }
        });
    }

    /**
     * Gets a template for displaying completed run details.
     */
    function getCompletedRunTemplate(context) {
        var html = $('  <div class="panel panel-default"> \
                            <div class="panel-heading" role="tab"> \
                                <h4 class="panel-title"> \
                                    <a role="button" data-toggle="collapse" data-parent="#completed_runs" href="#{{ run_uid }}" \
                                        aria-expanded="true" aria-controls="{{ run_uid }}"> \
                                        {{ finished }} \
                                    </a> \
                                </h4> \
                            </div> \
                            <div id="{{ run_uid }}" class="panel-collapse collapse {{ expanded }}" role="tabpanel"> \
                                <div class="panel-body"> \
                                    <div class="row"> \
                                       <div class="col-md-12"> \
                                           <div class="table-responsive"> \
                                               <table class="table"> \
                                                   <tr><td><strong>' + gettext('Run Id') + ':</strong></td><td><div id="runuid">{{ run_uid }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Status') + ':</strong></td><td><div id="status" class="{{ status_class }}" role="alert">{{ status }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Run by') + ':</strong></td><td><div id="user" class="{{ user }}">{{ user }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Started') + ' :</strong></td><td><div id="started">{{ started }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Finished') + ':</strong></td><td><div id="finished">{{ finished }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Duration') + ':</strong></td><td><div id="duration">{{ duration }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Provider') + ':</strong></td><td> \
                                                        <div id="providers"> \
                                                        </div> \
                                                    </td></tr> \
                                                    <tr id="exceptions-{{ run_uid }}" style="display: none;"><td><strong>' + gettext('Errors') + ':</strong></td><td> \
                                                        <div id="errors"> \
                                                            <table class="table table-condensed" width="100%"> \
                                                            <thead><th>Task</th><th>' + gettext('Error') + '</th></thead> \
                                                            </table> \
                                                        </div> \
                                                    </td></tr> \
                                               </table> \
                                           </div> \
                                       </div> \
                                    </div> \
                                </div> \
                            </div> \
                        </div>').html();
        var template = Handlebars.compile(html);
        return template;
    }

    /**
     * Gets a template for displaying completed run details.
     */
    function getFailedRunTemplate(context) {
        var html = $('  <div class="panel panel-default"> \
                            <div class="panel-heading" role="tab"> \
                                <h4 class="panel-title"> \
                                    <a role="button" data-toggle="collapse" data-parent="#completed_runs" href="#{{ run_uid }}" \
                                        aria-expanded="true" aria-controls="{{ run_uid }}"> \
                                        {{ finished }} \
                                    </a> \
                                </h4> \
                            </div> \
                            <div id="{{ run_uid }}" class="panel-collapse collapse {{ expanded }}" role="tabpanel"> \
                                <div class="panel-body"> \
                                    <div class="row"> \
                                       <div class="col-md-12"> \
                                           <div class="table-responsive"> \
                                               <table class="table"> \
                                                   <tr><td><strong>' + gettext('Run Id') + ':</strong></td><td><div id="runuid">{{ run_uid }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Status') + ':</strong></td><td><div id="status" class="{{ status_class }}" role="alert">{{ status }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Run by') + ':</strong></td><td><div id="user" class="{{ user }}">{{ user }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Started') + ' :</strong></td><td><div id="started">{{ started }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Finished') + ':</strong></td><td><div id="finished">{{ finished }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Duration') + ':</strong></td><td><div id="duration">{{ duration }}</div></td></tr> \
                                                    <tr id="exceptions-{{ run_uid }}"><td><strong>' + gettext('Errors') + ':</strong></td><td> \
                                                        <div id="errors"> \
                                                            <table class="table table-condensed" width="100%"> \
                                                            <thead><th>Task</th><th>' + gettext('Error') + '</th></thead> \
                                                            </table> \
                                                        </div> \
                                                    </td></tr> \
                                               </table> \
                                           </div> \
                                       </div> \
                                    </div> \
                                </div> \
                            </div> \
                        </div>').html();
        var template = Handlebars.compile(html);
        return template;
    }



    /**
     * Loads the job details.
     * This occurs initially on page load..
     */
    function loadSubmittedRunDetails(){
        var job_uid = exports.detail.job_uid;
        $.ajax({
            cache: false,
            dataType: 'json',
            url: Config.RUNS_URL + '?status=SUBMITTED&job_uid=' + job_uid,
            success: function(data){
                if (data.length > 0) {
                    initSumtittedRunPanel(data);
                    startRunCheckInterval();
                }
            }
        });
    }

    /**
     * Initializes the submitted run panel.
     */
    function initSumtittedRunPanel(data){
        var $runPanel = $('#submitted_runs > .panel-group');
        $runPanel.empty();
        if (data.length > 0) {
            // display the submitted run
            $('#submitted_runs').css('display', 'block');
            // disable the re-run button..
            $('button#rerun').prop('disabled', true);
            $('button#delete').prop('disabled', true);
        }
        else {
            // stop the interval timer..
            clearInterval(exports.detail.timer);
            // hide the submitted run div
            $('#submitted_runs').css('display', 'none');
            // reload the completed runs to show the latest run..
            loadCompletedRunDetails();
            // enable the re-run button..
            $('button#rerun').prop('disabled', false);
            $('button#delete').prop('disabled', false);
            return;
        }
        $.each(data, function(index, run){
            var started = moment(run.started_at).format('h:mm:ss a, MMMM Do YYYY');
            var duration = moment.duration(run.duration).humanize();
            var status_class = run.status === 'SUBMITTED' ? 'alert alert-info' : 'alert alert-warning';
            var expanded = index === 0 ? 'in' : ''; // collapse all for now..
            var context = { 'run_uid': run.uid, 'status': run.status,
                'started': started, 'user': run.user, 'status_class': status_class,
                'expanded': expanded};
            var template = getSubmittedRunTemplate();
            var html = template(context);
            $runPanel.append(html);
            // add data provider info
            $providersDiv = $('div#' + run.uid).find('#providers');
            var providers = run.provider_tasks;
            $.each(providers, function (i, provider) {
                var name = provider.name;
                $providersDiv.append('<table width="100%"><tr id="' + provider.uid + '"><td><strong>' + name + '</strong></td></tr>');
                // add task info

                var taskDiv = '<div><table border=0 class="table table-condensed">';
                var tasks = provider.tasks;
                $.each(tasks, function (i, task) {
                    //not showing OSMConf files
                    if (task.name != "OSMConf" && task.name != "WFSExport" && task.name != "ArcFeatureServiceExport") {
                        var result = task.result;
                        var status = task.status;
                        var duration = task.duration ? numeral(task.duration).format("HH:mm:ss.SSS") : ' -- ';
                        var descriptiveName = task.name;
                        //var descriptiveName = 'Name Placeholder';
                        if (status === 'PENDING' || status === 'RUNNING' || status === 'FAILED') {
                            cls = status.toLowerCase();
                            taskDiv+=('<tr class="' + cls + '" id="' + task.uid +'"><td>' + descriptiveName + '</td><td>' + duration + '</td><td> -- </td><td>' + task.status + '</td></tr>');
                        }
                        else {
                            cls = status.toLowerCase();
                            taskDiv+=('<tr class="' + cls + '" id="' + task.uid +'"><td>' + descriptiveName + '</td><td>' + duration + '</td><td>' + result.size + '</td><td>' + task.status + '</td></tr>');
                        }
                    }
                });

                taskDiv+=('</table></div>');
                $(taskDiv).appendTo('#providers');
                $providersDiv.append('</table>')
            });
        });
    }

    /**
     * Gets a template for displaying submitted run details.
     */
    function getSubmittedRunTemplate(context) {
        var html = $('  <div class="panel panel-default"> \
                            <!-- \
                            <div class="panel-heading" role="tab"> \
                                <h4 class="panel-title"> \
                                    <a role="button" data-toggle="collapse" data-parent="#submitted_runs" href="#{{ run_uid }}" \
                                        aria-expanded="true" aria-controls="{{ run_uid }}"> \
                                        {{ finished }} \
                                    </a> \
                                </h4> \
                            </div> \
                            --> \
                            <div id="{{ run_uid }}" class="panel-collapse collapse {{ expanded }}" role="tabpanel"> \
                                <div class="panel-body"> \
                                    <div class="row"> \
                                       <div class="col-md-12"> \
                                           <div class="table-responsive"> \
                                               <table class="table"> \
                                                   <tr><td><strong>' + gettext('Run Id') + ':</strong></td><td><div id="runuid">{{ run_uid }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Status') + ':</strong></td><td><div id="status" class="{{ status_class }}" role="alert">{{ status }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Started') + ':</strong></td><td><div id="started">{{ started }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Run by') + ':</strong></td><td><div id="user">{{ user }}</div></td></tr> \
                                                   <tr><td><strong>' + gettext('Provider') + ':</strong></td><td> \
                                                        <div id="providers"> \
                                                        </div> \
                                                   </td></tr> \
                                               </table> \
                                           </div> \
                                       </div> \
                                   </div> \
                                </div> \
                            </div> \
                        </div>').html();
        var template = Handlebars.compile(html);
        return template;
    }

    /**
     * Updates the submitted run details to show task status.
     *
     * data: the data to update
     */
    function updateSubmittedRunDetails(data){
        if (data.length > 0) {
            var run = data[0];
            var run_uid = run.uid;
            var $runDiv = $('#' + run_uid);
            var providers = run.provider_tasks;
            $.each(providers, function(i, provider){
                var provideruid = provider.uid;
                var name = provider.name;
                var tasks = provider.tasks;
                var $tr = $runDiv.find('table').find('tr#' + provideruid);
                $tr.html('<td>' + name + '</td></tr>');
                $.each(tasks, function(i, task) {
                    if (task.name != "OSMConf" && task.name != "WFSExport" && task.name != "ArcFeatureServiceExport") {
                        var uid = task.uid;
                        var result = task.result;
                        var status = task.status;
                        var duration = task.duration ? numeral(task.duration).format("HH:mm:ss.SSS") : ' -- ';
                        var descriptiveName = task.name;
                        //var descriptiveName = 'Name Placeholder';
                        var $tr = $runDiv.find('table').find('tr#' + uid);
                        if (status === 'PENDING' || status === 'RUNNING' || status === 'FAILED') {
                            $tr.removeClass();
                            $tr.addClass(status.toLowerCase());
                            $tr.html('<td>' + descriptiveName + '</td><td> -- </td><td> -- </td><td>' + task.status + '</td>');
                        }
                        else {
                            $tr.removeClass();
                            $tr.addClass(status.toLowerCase());
                            $tr.html('<td><a href="' + result.url + '">' + descriptiveName + '</a></td><td>' + duration + '</td><td>' + result.size + '</td><td>' + task.status + '</td>');
                        }

                    }
                });

            });
        }
        else {
            // stop the interval timer..
            clearInterval(exports.detail.timer);
            exports.detail.timer = false;

            // reload the completed runs to show the latest run..
            loadCompletedRunDetails();

            // enable the re-run button..
            $('button#rerun').prop('disabled', false);
            $('button#delete').prop('disabled', false);
        }
    }

    /*
     * Starts an interval timer to periodically
     * report the status of a currently running job.
     */
    function startRunCheckInterval(){
        var job_uid = exports.detail.job_uid;
        /*
         * Collapse the completed run panels before
         * updating the submitted run panel.
         * Only do this once before interval check kicks in.
         */
        if (!exports.detail.timer) {
            $('#completed_runs .panel-collapse').removeClass('in');
        }

        /*
         * Run a check on the submitted job
         * at an interval of 3 seconds.
         */
        exports.detail.timer = setInterval(function(){
            var job_uid = exports.detail.job_uid;
            var url = Config.RUNS_URL + '?job_uid=' +  job_uid + '&status=SUBMITTED&format=json';
            $.ajax({
                url: url,
                dataType: 'json',
                cache: false,
                success: function(data, textStatus, jqXhr){
                    updateSubmittedRunDetails(data);
                }
            });
        }, 3000);
    }

    function buildDeleteDialog(){

        var that = this;
        var options = {
            url: Config.JOBS_URL + '/' + exports.detail.job_uid,
            dataType: 'json',
            beforeSubmit: function(arr, $form, options) {
            },
            success: function(data, status, xhr) {
                if (status == 'nocontent') {
                    $('#details-row').css('display', 'none');
                    // display delete info..
                    $('#delete-info').css('display', 'block');
                }
            },
            error: function(xhr, status, error){
                var json = xhr.responseJSON
                console.log(error);
            },
        }

        var modalOpts = {
            keyboard: true,
            backdrop: 'static',
        }

        $("button#delete").bind('click', function(e){
            // stop form getting posted..
            e.preventDefault();
            $("#deleteExportModal").modal(modalOpts, 'show');
        });

        $("#deleteConfirm").click(function(){
            // post form..
            $('#deleteForm').ajaxSubmit(options);
            $("#deleteExportModal").modal('hide');
        });
    }

    function buildFeatureDialog(){
        var modalOpts = {
            keyboard: true,
            backdrop: 'static',
        }
        $("button#features").bind('click', function(e){
            $("#featuresModal").modal(modalOpts, 'show');
        });
    }

    function initPopovers(){
        $('button#rerun').popover({
            content: gettext("Run the export with the same geographic location and settings"),
            trigger: 'hover',
            delay: {show: 0, hide: 0},
            placement: 'top'
        });
        $('button#clone').popover({
            content: gettext("Clone this export while adjusting the settings"),
            trigger: 'hover',
            delay: {show: 0, hide: 0},
            placement: 'top'
        });
        $('button#features').popover({
            content: gettext("Show the selected features for this export"),
            trigger: 'hover',
            delay: {show: 0, hide: 0},
            placement: 'top'
        });

    }

    // ----- FEATURE SELECTION TREES ----- //

    /*
     * Initialises the HDM feature tree.
     */
    function initHDMFeatureTree(tags){

        $.get(Config.HDM_TAGS_URL, function(data){
            var level_idx = 0;
            var $tree = $('#hdm-feature-tree ul.nav-list');
            if (typeof data == 'object') {
                traverse(data, $tree, level_idx);
            }

            /*
             * Recursively builds the feature tree.
             */
            function traverse(data, $level, level_idx){
                $.each(data, function(k,v){
                    if ($(v).attr('displayName')){
                        var name = $(v).attr('displayName');
                        var tag = $(v).attr('tag');
                        var key = tag.split('=')[0];
                        var val = tag.split('=')[1];
                        var geom = $(v).attr('geom');
                        geom_str = geom.join([separator=',']);
                        var $entry = $('<li class="entry" data-toggle="tooltip" data-placement="right" title="' + key + '=' + val + '"><label><i class="fa fa-square-o fa-fw"></i>' + name + '</label>' +
                            '<div class="checkbox tree-checkbox"><input class="entry" type="checkbox" data-model="HDM" data-geom="' +
                            geom_str + '" data-key="' + key + '" data-val="' + val +'" data-name="' + name + '" disabled/></div>' +
                            '</li>');
                        $level.append($entry);
                    }
                    else {
                        var collapse = level_idx > 0 ? 'collapse' : '';
                        var state = level_idx == 0 ? 'open' : 'closed';
                        var icon = level_idx == 0 ? 'fa-minus-square-o' : 'fa-plus-square-o';
                        var root = level_idx == 0 ? 'root' : '';
                        var $nextLevel = $('<li class="level nav-header ' + state + ' ' + root + '"><label><i class="level fa ' + icon + ' fa-fw"></i>' + k + '</label>' +
                            '<div class="checkbox tree-checkbox"><input class="level" type="checkbox" disabled/></div>');
                        var $nextUL = $('<ul class="nav nav-list sub-level ' + collapse + '">');
                        $nextLevel.append($nextUL);
                        $level.append($nextLevel);
                        level_idx += 1;
                        traverse(v, $nextUL, level_idx);
                    }
                });
            }

            $.each(tags, function(idx, tag){
                var key = tag.key;
                var val = tag.value;
                // check the corresponding input on the tree
                var $input = $('#hdm-feature-tree').find('input[data-key="' + key + '"][data-val="' + val + '"]');
                $input.prop('checked', true);
                $input.prop('disabled', false);
                // check the parent levels
                $.each($input.parentsUntil('#hdm-feature-tree', 'li.level'),
                    function(idx, level){
                        $(level).children('div.tree-checkbox').find('input.level').prop('checked', true);
                        $(level).children('div.tree-checkbox').find('input.level').prop('disabled', false);
                    });
            });

            // toggle level collapse
            $('#hdm-feature-tree li.level > label').bind('click', function(e){
                if ($(this).parent().hasClass('open')) {
                    $(this).parent().removeClass('open').addClass('closed');
                    $(this).find('i.level').removeClass('fa-plus-minus-o').addClass('fa-plus-square-o');
                }
                else {
                    $(this).parent().removeClass('closed').addClass('open');
                    $(this).find('i.level').removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                }
                $(this).parent().children('ul.sub-level').toggle(150);
            });

            // prevent checkboxes from being deselected
            $('#hdm-feature-tree input[type="checkbox"]').on('click', function(e){
                e.preventDefault();
            });

        });
    }

    /*
     * Initialises the OSM feature tree.
     */
    function initOSMFeatureTree(tags){
        $.get(Config.OSM_TAGS_URL, function(data){
            var level_idx = 0;
            var $tree = $('#osm-feature-tree ul.nav-list');
            if (typeof data == 'object') {
                traverse(data, $tree, level_idx);
            }

            /*
             * Recursively builds the feature tree.
             */
            function traverse(data, $level, level_idx){
                $.each(data, function(k,v){
                    if ($(v).attr('displayName')){
                        var name = $(v).attr('displayName');
                        var tag = $(v).attr('tag');
                        var key = tag.split('=')[0];
                        var val = tag.split('=')[1];
                        var geom = $(v).attr('geom');
                        geom_str = geom.join([separator=',']);
                        var $entry = $('<li class="entry" data-toggle="tooltip" data-placement="right" title="' + key + '=' + val + '"><label><i class="fa fa-square-o fa-fw"></i>' + name + '</label>' +
                            '<div class="checkbox tree-checkbox"><input class="entry" type="checkbox" data-model="OSM" data-geom="' +
                            geom_str + '" data-key="' + key + '" data-val="' + val +'" data-name="' + name + '" disabled/></div>' +
                            '</li>');
                        $level.append($entry);
                    }
                    else {
                        var collapse = level_idx > 0 ? 'collapse' : '';
                        var state = level_idx == 0 ? 'open' : 'closed';
                        var icon = level_idx == 0 ? 'fa-minus-square-o' : 'fa-plus-square-o';
                        var root = level_idx == 0 ? 'root' : '';
                        var $nextLevel = $('<li class="level nav-header ' + state + ' ' + root + '"><label><i class="level fa ' + icon + ' fa-fw"></i>' + k + '</label>' +
                            '<div class="checkbox tree-checkbox"><input class="level" type="checkbox" disabled /></div>');
                        var $nextUL = $('<ul class="nav nav-list sub-level ' + collapse + '">');
                        $nextLevel.append($nextUL);
                        $level.append($nextLevel);
                        level_idx += 1;
                        traverse(v, $nextUL, level_idx);
                    }
                });
            }

            // toggle level collapse
            $('#osm-feature-tree li.level > label').bind('click', function(e){
                if ($(this).parent().hasClass('open')) {
                    $(this).parent().removeClass('open').addClass('closed');
                    $(this).find('i.level').removeClass('fa-plus-minus-o').addClass('fa-plus-square-o');
                }
                else {
                    $(this).parent().removeClass('closed').addClass('open');
                    $(this).find('i.level').removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                }
                $(this).parent().children('ul.sub-level').toggle(150);
            });

            $.each(tags, function(idx, tag){
                var key = tag.key;
                var val = tag.value;
                // check the corresponding input on the tree
                var $input = $('#osm-feature-tree').find('input[data-key="' + key + '"][data-val="' + val + '"]');
                $input.prop('checked', true);
                $input.prop('disabled', false);
                // check the parent levels
                $.each($input.parentsUntil('#osm-feature-tree', 'li.level'),
                    function(idx, level){
                        $(level).children('div.tree-checkbox').find('input.level').prop('checked', true);
                        $(level).children('div.tree-checkbox').find('input.level').prop('disabled', false);
                    });
            });

            // prevent checkboxes from being deselected
            $('#osm-feature-tree input[type="checkbox"]').on('click', function(e){
                e.preventDefault();
            });
        });
    }

    /*
     * Loads preset details on fetaures modal.
     */
    function initPresetList(configurations){
        var $filelist = $('#filelist');
        if (configurations.length > 0) {
            var config = configurations[0];
            var published = config.published ? gettext('Published') : gettext('Private');
            var created = moment(config.created).format('MMMM Do YYYY');
            var $tr = $('<tr id="' + config.uid + '" data-filename="' + config.filename + '"' +
                'data-type="' + config.config_type + '" data-published="' + config.published + '"' +
                'class="config"><td><i class="fa fa-file" style="margin-top: 0px !important;"></i>&nbsp;&nbsp;<span>' + config.filename + '</span></td>' +
                '<td>' + config.config_type + '</td><td>' + published + '</td><td>' + created + '</td></tr>');
            $filelist.append($tr);
        }
        else {
            // config most likely deleted
            $filelist.css('display','none');
            $('#config-deleted-message').css('display', 'block');
        }
    }

})();


$(document).ready(function() {
    // initialize the app..
    exports.detail.init();
});

