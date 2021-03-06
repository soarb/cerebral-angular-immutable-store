var cerebral = require('cerebral');
var angular = global.angular || require('angular');
var Store = require('immutable-store');
var EventEmitter = require('events').EventEmitter;

var Value = cerebral.Value;

var Factory = function (state, defaultArgs) {

  var eventHub = new EventEmitter();
  var initialState = Store(state);

  state = initialState;

  var controller = cerebral.Controller({
    defaultArgs: defaultArgs,
    onReset: function () {
      state = initialState;
    },
    onSeek: function (seek, isPlaying, currentRecording) {
      state = state.import(currentRecording.initialState);
      eventHub.emit('change', state);
    },
    onUpdate: function () {
      eventHub.emit('change', state);
    },
    onRemember: function () {
      eventHub.emit('remember', state);
    },
    onGet: function (path) {
      return Value(path, state);
    },
    onSet: function (path, value) {
      path = path.slice();
      var key = path.pop();
      state = Value(path, state).set(key, value);
    },
    onUnset: function (path) {
      path = path.slice();
      var key = path.pop();
      state = Value(path, state).unset(key);
    },
    onPush: function (path, value) {
      state = Value(path, state).push(value);
    },
    onSplice: function () {
      var args = [].slice.call(arguments);
      var value = Value(args.shift(), state);
      state = value.splice.apply(value, args);
    },
    onMerge: function (path, value) {
      state = Value(path, state).merge(value);
    },
    onConcat: function () {
      var args = [].slice.call(arguments);
      var value = Value(args.shift(), state);
      state = value.concat.apply(value, args);
    },
    onPop: function (path) {
      state = Value(path, state).pop();
    },
    onShift: function (path) {
      state = Value(path, state).shift();
    },
    onUnshift: function (path, value) {
      state = Value(path, state).unshift(value);
    }
  });

  controller.injectState = function ($scope, paths) {

    var update = function (newState) {
      Object.keys(paths).forEach(function (key) {
        $scope[key] = Value(paths[key], newState || state);
      });
      newState && $scope.$apply();
    };

    $scope.$on('$destroy', function () {
      eventHub.removeListener('change', update);
    });

    eventHub.on('change', update);
    eventHub.on('remember', update);
    update();

  };

  return controller;

};

angular.module('cerebral', [])
  .provider('cerebral', function () {

    var services = ['$http'];
    var state = {};
    var defaultArgs = {};

    this.setState = function (initialState) {
      state = initialState;
    };

    this.setDefaultArgs = function (args) {
      defaultArgs = args;
    };

    this.$get = services.concat([function () {
      var args = arguments;
      defaultArgs.services = services.reduce(function (services, service, index) {
        services[service] = args[index];
        return services;
      }, {});
      return new Factory(state, defaultArgs);
    }]);
  });

module.exports = angular;
