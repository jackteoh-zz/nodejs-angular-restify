angular.module("app",[])
.controller('pagerdutyctrl',pagerdutyctrl);

function pagerdutyctrl($scope,$http){
    $scope.datenow = new Date();
    $scope.datetime = {};

    $scope.loadschedule = function(){
        $http({
            method: 'GET',
            url: '/api/pager_get_schedule'
        })
        .then(function(res){
            console.log(res.data.maintenance_windows)
            $scope.pdObject = res.data.maintenance_windows
        })
        .catch(function (e) {
            console.log(e);
        })
    };

    $scope.createschedule = function(){
        $http({
            method: 'POST',
            url: '/api/pager_post_schedule',
            data: $scope.datetime
        })
        .then(function(res){
            console.log(res)
        })
        .catch(function (e) {
            console.log(e);
        })
        .finally(
            $scope.loadschedule
        )
    };

    $scope.endschedule = function(id){
        $http({
            method: 'POST',
            url: '/api/pager_delete_schedule',
            data : {'id':id}
        })
        .then(function(res){
            console.log(res)
        })
        .catch(function (e) {
            console.log(e);
        })
        .finally(
            $scope.loadschedule
        )
    };
};