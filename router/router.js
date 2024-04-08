class Router {
    constructor(routes) {
      this.routes = routes;
      this._loadInitialRoute();
      this._bindListeners();
    }
  
    _loadInitialRoute() {
      const path = window.location.pathname;
      this._handleRoute(path);
    }
  
    _bindListeners() {
      window.onpopstate = () => {
        const path = window.location.pathname;
        this._handleRoute(path);
      };
      document.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
          e.preventDefault();
          const path = e.target.href;
          history.pushState(null, null, path);
          this._handleRoute(path);
        }
      });
    }
  
    _handleRoute(path) {
      const route = this.routes.find(route => route.path === path);
      if (route) {
        route.handler();
      } else {
        this._defaultRouteHandler();
      }
    }
  
    _defaultRouteHandler() {
      // Handle 404 or default route behavior
      console.error('Route not found');
    }
  
    navigateTo(path) {
      history.pushState(null, null, path);
      this._handleRoute(path);
    }
  }
  
  // Example usage:
  const routes = [
    {
      path: '/',
      handler: () => console.log('Home page')
    },
    {
      path: '/about',
      handler: () => console.log('About page')
    },
    {
      path: '/contact',
      handler: () => console.log('Contact page')
    }
  ];
  
  const router = new Router(routes);
  