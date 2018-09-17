(function (routeConfig) {

    'use strict';
  
    routeConfig.init = function (app) {
  
      // *** routes variable *** //
      const routes = require('../routes/index');
      const scrappingRoutes = require('../routes/Scrapping');
  
      // *** Our Routes *** //
      app.use('/', routes);
      app.use('/api/v1', scrappingRoutes);
    };
  
  })(module.exports);