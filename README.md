# MyAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.11.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Logistics and deployment

Logistics groups Products, Customer, Cart, Account, My orders and the role-protected
Admin workspace. Existing URLs such as /orders/1 remain valid. The backend source
is https://github.com/wphr2101/AppServiceApi.

Local development uses the ignored src/app/api.config.ts. For a clean checkout,
copy src/app/api.config.ci.ts there before testing, then configure local values.

Production builds replace it with api.config.production.ts, which reads the
browser-visible public/client-config.js. The default base URL is the current
origin. Deployment supplies the existing API access key in that file; server
credentials, SQL passwords and publish profiles must never be placed there.
Browser keys are visible to clients; cookie authentication and API role checks
protect customer/admin operations.

The Azure Pipeline tests the frontend and a pinned backend commit, builds both,
and publishes a deploy artifact containing deploy.zip and a release manifest.
The artifact contains no server appsettings files or deployment credentials.
Deploy the artifact to the existing App Service using an authorized Azure
session, keeping Azure application settings and the database intact. The
pipeline itself currently produces the release package; Azure publishing is a
separate authenticated deployment step.
