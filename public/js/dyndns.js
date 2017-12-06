angular.module("app",[])
.controller('dyndnsctrl',dyndnsctrl);

function dyndnsctrl($scope,$http){
    
    $scope.auth = {};
    
    $scope.checkToken = function(){
        $scope.token = sessionStorage.getItem("token")
        if ($scope.token) {
            loadfi();
        }
    };

    var loadfi = function(){
        $http.get('/api/fi')
        .then(function(res){
            console.log(res)
            $scope.showfis = res.data;
        }); 
    };

    $scope.signin = function () {
        $http({
            method: 'POST',
            url:'/api/dyn_signin',
            data: $scope.auth
        })
        .then(function(res){
            console.log(res)
            sessionStorage.token = res.data.data.token
            $scope.token = res.data.data.token
        })
        .catch(function (e) {
            console.log(e);
        })
        .finally(function () {
            loadfi();
        })
    };

    $scope.signout = function () {
        sessionStorage.clear();
        $scope.token = null;
        $scope.showfis = null;
        $http({
            method: 'POST',
            url:'/api/dyn_signout'
        })  
        .then(function(res){
        console.log(res)
        })
    };

    $scope.getIP = function (index,zone,fqdn){
        $scope.loading = true;
        console.log(index,zone,fqdn);
        $http({
            method: 'POST',
            url: '/api/dyn_refresh_ip/',
            data : {'zone':zone,'fqdn':fqdn}
        })
        .then(function (res) {
            console.log(res);
            $scope.showfis[index].cip = res.data.data.rdata.address;
        })
        .catch(function (e) {
            console.log(e);
        })
        .finally(function () {
            $scope.loading = false;
        })
    };

    $scope.updateIP = function (index,zone,fqdn,ip){
        $scope.loading = true;
        console.log(index,zone,fqdn,ip);
        $http({
            method: 'POST',
            url: '/api/dyn_update_ip/',
            data : {'zone':zone,'fqdn':fqdn,'ip':ip}
        })
        .then(function (res) {
            console.log(res);
            $scope.getIP(index,zone,fqdn);
        })
        .catch(function (e) {
            console.log(e);
        })
        .finally(function () {
            $scope.loading = false;
        })
    };
};