'use strict';

angular.module('o19s.splainer-search')
  .service('solrSearcherPreprocessorSvc', function solrSearcherPreprocessorSvc(solrUrlSvc, defaultSolrConfig) {
    var self      = this;
    self.prepare  = prepare;

    var withoutUnsupported = function (argsToUse, sanitize) {
      var argsRemoved = angular.copy(argsToUse);
      if (sanitize === true) {
        solrUrlSvc.removeUnsupported(argsRemoved);
      }
      return argsRemoved;
    };

    // the full URL we'll use to call Solr
    var buildCallUrl = function(searcher) {
      var fieldList = searcher.fieldList;
      var url       = searcher.url;
      var config    = searcher.config;
      var args      = withoutUnsupported(searcher.args, config.sanitize);
      var queryText = searcher.queryText;


      args.fl = (fieldList === '*') ? '*' : [fieldList.join(' ')];
      args.wt = ['json'];

      if (config.debug) {
        args.debug = ['true'];
        args['debug.explain.structured'] = ['true'];
      }

      if (config.highlight) {
        args.hl                 = ['true'];
        args['hl.fl']           = args.fl;
        args['hl.simple.pre']   = [searcher.HIGHLIGHTING_PRE];
        args['hl.simple.post']  = [searcher.HIGHLIGHTING_POST];
      }

      if (config.escapeQuery) {
        queryText = solrUrlSvc.escapeUserQuery(queryText);
      }

      var baseUrl = solrUrlSvc.buildUrl(url, args);
      baseUrl = baseUrl.replace(/#\$query##/g, encodeURIComponent(queryText));

      return baseUrl;
    };

    function prepare (searcher) {
      if (searcher.config === undefined) {
        searcher.config = defaultSolrConfig;
      } else {
        // make sure config params that weren't passed through are set from
        // the default config object.
        searcher.config = angular.merge({}, defaultSolrConfig, searcher.config);
      }

      searcher.callUrl = buildCallUrl(searcher);

      searcher.linkUrl = searcher.callUrl.replace('wt=json', 'wt=xml');
      searcher.linkUrl = searcher.linkUrl + '&indent=true&echoParams=all';
    }
  });
