# CivicEvents+ – City Events and Community Portal

CivicEvents+ is a web application designed to help people discover community events, view public announcements, and explore promotional content.

The platform provides authentication and role-based interface features, allowing regular users to access community content while administrators can access event-management functionality.

## Project Features

- Create an account and sign in.
- Browse and view community events.
- Search events by keyword.
- Filter events by category.
- Create events through the administrator event form.
- View public announcements.
- Access audio announcement content when provided by the API.
- View promotional content, including videos and captions when provided by the API.
- Display messages for loading states, errors, and user actions.
- Show different interface controls depending on the user's authentication state and role.
- Responsive interface for desktop and mobile devices.

The availability of individual features depends on the frontend logic implemented in `app.js` and the endpoints provided by the backend API.

## Project Structure

The repository is organized into two main folders:

**`frontend/`**: Contains the user interface, including HTML, CSS, JavaScript, and frontend documentation.

**`backend/`**: Contains the Node.js API, database configuration, migrations, and server-side functionality.

The main frontend files are:

- `frontend/index.html`: Defines the page structure, navigation, events section, announcements, promotions, and authentication modal.
- `frontend/styles.css`: Contains custom styles used alongside Tailwind CSS.
- `frontend/app.js`: Handles frontend interactions, API requests, authentication state, and dynamic content.
- `frontend/README.md`: Documents the frontend implementation and setup instructions.

## Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript
- jQuery
- Tailwind CSS

### Backend and Database

- Node.js
- Express.js
- PostgreSQL
- REST API

## Getting Started

Follow these steps to run the application locally.

### 1. Start the Backend

Open PowerShell in the project root directory and run:

```powershell
cd .\backend
npm install
npm run dev
```

Make sure PostgreSQL is running and the backend environment variables are configured in `backend/.env`.

The backend health endpoint is:

`http://localhost:4000/health`

When the backend is running correctly, the endpoint should return a response similar to:

```json
{"ok":true,"env":"development"}
```

### 2. Run the Frontend

Open the project in Visual Studio Code.

If you have not installed it yet, install the **Live Server** extension.

In VS Code, right-click `frontend/index.html` and select **Open with Live Server**.

The frontend commonly opens at:

`http://127.0.0.1:5500/frontend/index.html`

The port may differ if Live Server selects another available port.

### 3. Connect the Frontend to the Backend

The frontend communicates with the backend through REST API requests.

The local API base URL is:

`http://localhost:4000/api`

The API configuration and request-handling logic are managed in:

- `frontend/app.js`

Make sure the backend server is running before testing features that require authentication or data from the API.

If the backend runs on a different port or address, update the API configuration in `app.js` to match.

For deployment, configure the frontend to use the deployed backend API address.

## Environment Variables

The backend uses environment variables to configure its database connection, authentication, and server.

Configure these in `backend/.env` using the variable names expected by the backend code.

Common settings may include:

| Variable | Purpose |
|---|---|
| `DB_USER` | PostgreSQL username |
| `DB_PASS` | PostgreSQL password |
| `DB_HOST` | Database host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `PORT` | Backend server port |

**Important:** Check the backend configuration to confirm the exact environment variable names required by your project. Never commit `.env` files, database passwords, or authentication secrets to GitHub.

## Role-Based Access Control

CivicEvents+ supports two application roles.

### Regular Users

Regular users can access the general interface and features available to their accounts, including:

- Signing in and creating an account.
- Browsing published community events.
- Searching and filtering events.
- Viewing announcements and promotional content.

Other user actions are available only where implemented in the frontend and supported by the backend API.

### Administrators

Administrators can access additional interface functionality, including:

- Accessing the administrator event-creation panel.
- Entering event details through the event form.
- Submitting event creation requests to the backend.

The frontend uses authentication state and user-role information to control the visibility of certain interface elements.

Hiding an element in HTML is not a security measure by itself. The backend must independently authenticate requests and enforce permissions for administrator-only operations.

## Code Documentation

The HTML file contains comments explaining the purpose of major interface sections and important elements.

The main interface sections include navigation, the hero section, event browsing and creation, announcements, promotional content, and authentication.

The JavaScript file, `app.js`, handles interactions between these elements and the backend API.

When modifying the interface, keep the HTML element IDs consistent with the IDs referenced by `app.js`. Changes to form fields, buttons, or content containers may require corresponding JavaScript updates.

Role-based interface logic should also be documented in the relevant JavaScript sections. Backend authorization remains responsible for protecting restricted operations.

## Troubleshooting

### Events or content do not load

1. Confirm PostgreSQL is running.
2. Confirm the backend server is running.
3. Open `http://localhost:4000/health` to check the backend.
4. Verify the API base URL in `frontend/app.js`.
5. Open your browser's developer tools and check the Console and Network tabs for errors.

### Login or registration fails

1. Confirm the backend is running and connected to PostgreSQL.
2. Check that the account credentials are correct.
3. If the browser is reusing an expired authentication token, sign out and sign in again.
4. If necessary, clear the CivicEvents+ authentication values from browser local storage and retry.

### The administrator event panel is missing

Confirm that you are signed in with an account whose role is `admin`.

The frontend may hide the event-creation panel for regular users. If the panel remains unavailable for an administrator, check the role information returned by the backend and the role-handling logic in `app.js`.

## Security Notes

- Do not commit `backend/.env` to GitHub.
- Never expose database credentials or JWT secrets in frontend code.
- Do not rely on hidden buttons or HTML elements to protect administrator actions.
- Enforce authentication and authorization on the backend for restricted API operations.

## Repository Information

This project was developed as part of the **Advanced Frontend Development Summative Project**.

The frontend implementation is maintained in the `frontend/` directory, while the backend API and database functionality are maintained in the `backend/` directory.

**GitHub link**: https://github.com/JesseN661/advanced-frontend-dev-summative-civic-event-project.git

**Video Demo** is in video-demo/README.md