class Router {
    constructor() {
      this.routes = {};
      this.currentRoute = null;
      this.historyStack = [];
      this.errorHandler = null;
      this.notFoundHandler = null;
    }
  
    addRoute(path, handler, options = {}) {
      const { name, middleware = [] } = options;
      const route = this.parseRoute(path);
      this.routes[path] = { handler, middleware, ...route };
      if (name) {
        this.routes[name] = { path, handler, middleware, ...route };
      }
    }
  
    addNestedRoute(parentPath, path, handler, options = {}) {
      const fullPath = `${parentPath}/${path}`;
      this.addRoute(fullPath, handler, options);
    }
  
    setErrorHandler(handler) {
      this.errorHandler = handler;
    }
  
    setNotFoundHandler(handler) {
      this.notFoundHandler = handler;
    }
  
    navigate(path, params = {}) {
      const route = this.findRoute(path);
      if (route) {
        const { path: routePath, handler, middleware = [], segments } = route;
        const finalParams = this.buildParams(segments, params);
        this.historyStack.push({ path: routePath, params: finalParams });
        window.history.pushState(finalParams, "", this.buildPath(routePath, finalParams));
        this.runMiddleware(middleware, finalParams);
        this.currentRoute = handler;
        this.currentRoute(finalParams);
      } else {
        if (this.notFoundHandler) {
          this.notFoundHandler();
        } else {
          console.error(`Route ${path} not found.`);
        }
      }
    }
  
    goBack() {
      if (this.historyStack.length > 1) {
        this.historyStack.pop();
        const { path, params } = this.historyStack[this.historyStack.length - 1];
        window.history.back();
        this.currentRoute = this.findRoute(path).handler;
        this.currentRoute(params);
      }
    }
  
    start() {
      window.addEventListener("popstate", (event) => {
        const { path, params } = event.state || this.historyStack[this.historyStack.length - 1];
        this.currentRoute = this.findRoute(path).handler;
        this.currentRoute(params);
      });
    }
  
    findRoute(path) {
      for (const [key, value] of Object.entries(this.routes)) {
        const regex = this.buildRegex(key);
        const match = path.match(regex);
        if (match) {
          const params = this.extractParams(value.segments, match);
          return { path: key, handler: value.handler, middleware: value.middleware, segments: value.segments, params };
        }
      }
      return null;
    }
  
    buildPath(path, params) {
      let finalPath = path;
      for (const segment of path.split("/")) {
        if (segment.startsWith("{") && segment.endsWith("}")) {
          const key = segment.slice(1, -1);
          finalPath = finalPath.replace(segment, params[key]);
        }
      }
      return finalPath;
    }
  
    buildRegex(path) {
      let regex = "^";
      for (const segment of path.split("/")) {
        if (segment.startsWith("{") && segment.endsWith("}")) {
          regex += "/([^/]+)";
        } else {
          regex += `/${segment}`;
        }
      }
      regex += "$";
      return new RegExp(regex);
    }
  
    extractParams(segments, match) {
      const params = {};
      for (let i = 1; i < match.length; i++) {
        const segment = segments[i - 1];
        params[segment.slice(1, -1)] = match[i];
      }
      return params;
    }
  
    parseRoute(path) {
      const segments = [];
      let currentSegment = "";
      for (const char of path) {
        if (char === "{") {
          currentSegment = "{";
        } else if (char === "}") {
          currentSegment += "}";
          segments.push(currentSegment);
          currentSegment = "";
        } else if (char === "/") {
          if (currentSegment) {
            segments.push(currentSegment);
            currentSegment = "";
          }
        } else {
          currentSegment += char;
        }
      }
      if (currentSegment) {
        segments.push(currentSegment);
      }
      return { segments };
    }
  
    buildParams(segments, params) {
      const finalParams = {};
      for (const segment of segments) {
        if (segment.startsWith("{") && segment.endsWith("}")) {
          const key = segment.slice(1, -1);
          finalParams[key] = params[key];
        }
      }
      return finalParams;
    }
  
    runMiddleware(middleware, params) {
      middleware.forEach((fn) => fn(params));
    }
  }
  
  // Usage example
  const router = new Router();
  
  router.addRoute("/", () => {
    console.log("Rendering home page");
  });
  
  router.addRoute("/about", () => {
    console.log("Rendering about page");
  }, { name: "about" });
  
  router.addNestedRoute("/users", "{id}/posts/{slug}", (params) => {
    console.log(`Rendering post page for user with ID ${params.id} and post slug ${params.slug}`);
  }, { name: "post" });
  
  router.setNotFoundHandler(() => {
    console.error("Page not found");
  });
  
  router.start();
  
  router.navigate("/");
  router.navigate("/about");
  router.navigate("/users/123/posts/my-post-slug");
  router.navigate("/non-existing-route");
  router.goBack();