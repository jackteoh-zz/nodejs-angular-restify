const request = require('request');
const restify = require('restify');
const restify_clients = require('restify-clients');
var dyntoken,dynarecord,dynip;
var hipchat_token =''
var pagerduty_token = '';


var client = restify_clients.createJsonClient({
    url: 'https://api.dynect.net',  
    headers: {'Content-Type': 'application/json'}
});

function fi (req,res,next) {
    var json = require('./fi.json');
    console.log(json)
    res.send(json)
};

function dyn_post_session(req,res,next) {
    var data = {
        customer_name: '',
        user_name: req.body.user,
        password: req.body.pass
    };
    console.log(data);
    client.post('/REST/Session/',data,function(err, req, resc, obj){
        console.log('%d -> %j', resc.statusCode, resc.headers);
        console.log('%j', obj);
        dyntoken = obj.data.token;
        res.send(obj);
    });
};

function dyn_delete_session(req,res,next) {
    var options = {
        path: '/REST/Session/',
        headers: {'Auth-Token':dyntoken}
    };
    client.del(options,function(err, req, delres, obj){
        console.log('%d -> %j', delres.statusCode, delres.headers);
        console.log('%j', obj);
        res.send(obj);
    });
};

function dyn_get_session(req,res,next) {
    var options = {
        path: '/REST/Session/',
        headers: {'Auth-Token':dyntoken}
    };
    client.get(options,function(err, sessionreq, sessionres, obj){
        console.log('%d -> %j', sessionres.statusCode, sessionres.headers);
        console.log('%j', obj);
        res.sent(obj);
    });
};

function  dyn_refresh_ip(req,res,next){
    var options = {
        path :'/REST/ARecord/'+req.body.zone+'/'+req.body.fqdn,
        headers: {'Auth-Token':dyntoken}
    };
    console.log(options)
    client.get(options,function(err, req, arecordres, obj){
        console.log('%d -> %j', arecordres.statusCode, arecordres.headers);
        console.log('%j', obj);
        var dynarecord = obj.data;

        var options = {
            path :dynarecord,
            headers: {'Auth-Token':dyntoken}
        };
        client.get(options,function(err, req, ipres, obj){
            console.log('%d -> %j', ipres.statusCode, ipres.headers);
            console.log('%j', obj);
            res.send(obj)
        });
    });
}

function dyn_update_ip(req,res,next){
    dynip = req.body.ip;
    var options = {
        path :'/REST/ARecord/'+req.body.zone+'/'+req.body.fqdn,
        headers: {'Auth-Token':dyntoken}
    };
    console.log(options)
    console.log("GET ARECORDS")
    client.get(options,function(err, req, arecordres,obj){
        console.log('%d -> %j', arecordres.statusCode, arecordres.headers);
        console.log('%j', obj);
        var dynarecord = obj.data[0];

        var options = {
            path :dynarecord,
            headers: {'Auth-Token':dyntoken}
        };

        var data = {
            ttl:'0',
            rdata:{'address':dynip}
        }
        console.log("PUT ARECORDS")
        console.log(options);
        client.put(options,data,function(err, req, ipres, obj){
            console.log('%d -> %j', ipres.statusCode, ipres.headers);
            console.log('%j', obj);

            var zone = obj.data.zone
            var options = {
                path :'/REST/Zone/'+zone,
                headers: {'Auth-Token':dyntoken}
            };
            console.log("Publish ARECORDS")
            console.log(options);
            client.put(options,{publish:"true"},function(err, req, zoneres, obj){
                console.log('%d -> %j', zoneres.statusCode, zoneres.headers);
                console.log('%j',obj);
                res.send(obj);
                var message = "DynDns :: "+obj.msgs[0].INFO
                hipchat_post_message(message)
            });
        });
    });    
};

function hipchat_post_message(text){
    var client = restify_clients.createJsonClient({
        url: 'https://api.hipchat.com',  
        headers: {'Content-Type': 'application/json'}
    });
    var options = {
        path: '/v2/room/231895/notification?auth_token='+hipchat_token
    };
    var data = {
        notify : "true" ,
        message_format : "html",
        message:text
    }
    client.post(options,data,function(err, req, res, obj){
        console.log('%d -> %j', res.statusCode, res.headers);
        console.log('%j', obj);
    });
};

function pager_get_schedule(req,res,next){

    const options = {
        url: 'https://api.pagerduty.com/maintenance_windows',
        headers: {
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'Authorization': 'Token token='+pagerduty_token
        },
        json:true
    };
    request.get(options, function(error, response, body){
        console.log(body);
        res.send(body)
    });
};

function pager_post_schedule(req,res,next){

    var startschedule = new Date(req.body.date)
    var stopschedule = new Date()
    stopschedule.setTime(startschedule.getTime() + (4*60*60*1000));

    const options = {
        url: 'https://api.pagerduty.com/maintenance_windows',
        headers: {
            "Content-Type": "application/json",
            'Accept': 'application/vnd.pagerduty+json;version=2',
            "From": "sre@alkamitech.com",
            'Authorization': 'Token token='+pagerduty_token
        },
        body: {
            'maintenance_window' : {
                'type':"maintenance_window",
                'start_time' : startschedule ,
                'end_time' : stopschedule ,
                'description' : "Scheduled Maintenance" ,
                'services': [{'id':'P7S1CSB','type':'service_reference'}]
                }
            },
        json: true
        }
    
    request.post(options,function(error, response, body){
        console.log(body);
        res.send(body)
    });
};

function pager_delete_schedule(req,res,next){
    
    const options = {
        url: 'https://api.pagerduty.com/maintenance_windows/'+req.body.id,
        headers: {
            "Content-Type": "application/json",
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'Authorization': 'Token token='+pagerduty_token
        },
        json: true
        }
    
    request.delete(options,function(error, response, body){
        console.log(body);
        res.send(body)
    });
};

var server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.jsonp());

server.get('/api/fi', fi);
server.post('/api/dyn_signin',dyn_post_session);
server.post('/api/dyn_signout',dyn_delete_session);

server.post('/api/dyn_refresh_ip/',dyn_refresh_ip);
server.post('/api/dyn_update_ip',dyn_update_ip);

server.post('api/hipchat_post_message',hipchat_post_message);

server.get('api/pager_get_schedule',pager_get_schedule);
server.post('api/pager_post_schedule',pager_post_schedule);
server.post('api/pager_delete_schedule',pager_delete_schedule);

server.get('/\/.*/', restify.plugins.serveStatic({
      directory: "public",
      default: 'index.html'
    })
);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
