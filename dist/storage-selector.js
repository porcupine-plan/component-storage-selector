if (typeof angular !== "undefined") {
  angular.module("risevision.widget.common.storage-selector.config", [])
    .value("STORAGE_MODAL", "https://apps.risevision.com/storage-selector.html#/?cid=");
}

(function () {
  "use strict";

  angular
    .module("risevision.widget.common.storage-selector", [
      "risevision.widget.common.storage-selector.config",
    ])
    .directive("storageSelector", [
      "$templateCache",
      "$log",
      "fileManagerConfig",
      function ($templateCache, $log, fileManagerConfig) {
        return {
          restrict: "EA",
          scope: {
            fileType: "@",
            selectionType: "@",
            label: "@",
            selected: "=",  //url
          },
          template: $templateCache.get("storage-selector.html"),
          link: function (scope) {
            scope.open = function () {
              console.log("fileManagerConfig", fileManagerConfig);
              var fileManager = window.eyeconicFileManager;


              var imageExtensions = [
                ".jpg",
                ".jpeg",
                ".png",
                ".bmp",
                ".svg",
                ".gif",
                ".webp",
              ];

              var videoExtensions = [".webm", ".mp4", ".ogv", ".ogg"];
              var extensions;

              switch (scope.fileType) {
                case "image":
                  extensions = imageExtensions;
                  break;
                case "video":
                  extensions = videoExtensions;
                  break;
                default: {
                  extensions = [];
                  imageExtensions.forEach(function(x){
                    extensions.push(x);
                  });
                  videoExtensions.forEach(function(x){
                    extensions.push(x);
                  });
                }
              }

              function hasValidExtension(url) {
                var testUrl = url.toLowerCase();

                for (var i = 0, len = extensions.length; i < len; i++) {
                  if (testUrl.indexOf(extensions[i]) !== -1) {
                    return true;
                  }
                }

                return false;
              }

              function getDirectoryHistory(url) {
                if (url) {
                  var a = url.replace("http://", "").replace("https://", "");

                  var root = fileManagerConfig.root;
                  var splitted = a.split(root);
                  var breadcrumbs = [];

                  if (splitted.length >= 2) {
                    var portion = splitted[1].split("/");
                    var pathPrefix = root;

                    portion.forEach(function (p, index) {
                      if (p.length > 0) {
                        if (index + 1 !== portion.length || !p.includes(".")) {
                          breadcrumbs.push({
                            path: pathPrefix + p + "/",
                            displayName: p,
                          });
                          pathPrefix = pathPrefix + p + "/";
                        }
                      }
                    });
                  }
                  return breadcrumbs;
                }
                return [];
              }

              function typeFilter(item) {
                return !item.mimeType || hasValidExtension(item.url);
              }
              var fileManagerInstance;
              var fileManagerProps = Object.assign({}, fileManagerConfig, {
                filterItems: typeFilter,
                selectionType: scope.selectionType,
                accept: extensions.join(","),
                directoryHistory: scope.selected ? getDirectoryHistory(scope.selected) : [],
                onSelected: function (test) {
                  // for unit test purposes
                  scope.files = [test.url];

                  $log.info("Picked: ", scope.files);
                  fileManagerInstance.setOpen(false);
                  // emit an event with name "files", passing the array of files selected from storage and the selector type
                  scope.$emit(
                    "picked",
                    scope.files,
                    scope.fileType,
                    test,
                    scope.selectionType
                  );
                },
              });

              fileManagerInstance = fileManager.useFileManager(
                fileManagerProps,
                document.getElementById("file-selector")
              );

              fileManagerInstance.setOpen(true);
            };
          },
        };
      },
    ]);
})();

angular.module("risevision.widget.common.storage-selector")
  .controller("StorageCtrl", ["$scope", "$modalInstance", "storageUrl", "$window", "$log", "STORAGE_MODAL",
    function($scope, $modalInstance, storageUrl, $window, $log, STORAGE_MODAL){

      $scope.storageUrl = storageUrl;

      $scope.isSameOrigin = function (origin) {
        var parser = document.createElement("a");
        parser.href = STORAGE_MODAL;

        return origin.indexOf(parser.host) !== -1;
      };

      $scope.messageHandler = function (event) {
        if (!$scope.isSameOrigin(event.origin)) {
          return;
        }

        if (Array.isArray(event.data)) {
          $modalInstance.close(event.data);
        } else if (typeof event.data === "string") {
          if (event.data === "close") {
            $modalInstance.dismiss("cancel");
          }
        }
      };

      $window.addEventListener("message", $scope.messageHandler);

  }]);

(function(module) {
try { module = angular.module("risevision.widget.common.storage-selector"); }
catch(err) { module = angular.module("risevision.widget.common.storage-selector", []); }
module.run(["$templateCache", function($templateCache) {
  "use strict";
  $templateCache.put("storage-selector.html",
    "<button class=\"btn btn-default\" ng-class=\"{active: selected}\" ng-click=\"open()\" type=\"button\" >\n" +
    "  {{ label }}<img src=\"http://s3.amazonaws.com/Rise-Images/Icons/storage.png\" class=\"storage-selector-icon\" ng-class=\"{'icon-right': label}\">\n" +
    "</button>\n" +
    "<div id=\"file-selector\"></div>\n" +
    "\n" +
    "");
}]);
})();
