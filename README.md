# LMS Native App

A robust React Native application built with Expo for managing Laboratory/Learning Management System operations. This application supports role-based access for Super Admins and Branch Admins, offering features like dashboard analytics, report generation, user management, and more.

## Features

*   **Role-Based Access Control (RBAC)**:
    *   **Super Admin**: Full access to Dashboard, Branch Management, Test/Doctor Masters, Reports, and Settings.
    *   **Branch Admin**: Focused access to Branch Reports (Summary, Monthly Breakdowns) and Branch User Management.
*   **Authentication**: Secure login flow with persistent sessions.
*   **Dashboard**: Real-time overview of key metrics.
*   **Reports**: Detailed reports including Summary, Branch Monthly Breakdown, and Test Monthly Breakdown.
*   **User Management**:
    *   Manage Branch Admins.
    *   Manage Branch Users (Receptionists, Technicians) with specific branch assignments.
*   **Masters**: Manage Tests and Doctors (Super Admin).
*   **Theming**: Support for Light, Dark, and System default themes.

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   **Node.js**: Download and install Node.js (v14 or newer recommended).
*   **npm** or **yarn**: Default package managers for Node.js.
*   **Expo Go**: Install the Expo Go app on your iOS or Android device from the App Store or Google Play Store to run the app on a physical device.

## Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory:
    ```bash
    cd lms_native
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

## Configuration

This app connects to a backend API. You need to configure the API base URL.

1.  Open `services/api.ts`.
2.  Update the `baseURL` to point to your backend server:
    ```typescript
    const api = axios.create({
      baseURL: "http://your-backend-ip:5000", // Update this
    });
    ```
    *Note: If running on a physical Android device, use your computer's local IP address (e.g., `http://192.168.1.10:5000`) instead of `localhost`.*

## Running the Application

To start the development server:

```bash
npm start
# or
npx expo start
```

This will start the Metro Bundler. You will see a QR code in the terminal.

*   **Run on Android/iOS Device**: Scan the QR code using the **Expo Go** app (Android) or the Camera app (iOS).
*   **Run on Emulator/Simulator**: Press `a` for Android Emulator or `i` for iOS Simulator in the terminal window.

## Project Structure

*   **`app/`**: Contains the Expo Router file-based routing logic.
    *   **`(auth)/`**: Authentication routes (Login).
    *   **`(drawer)/`**: Main application screens inside the drawer navigation.
*   **`components/`**: Reusable UI components.
*   **`context/`**: React Context providers (AuthContext, ThemeContext).
*   **`services/`**: API configuration and service calls.
*   **`assets/`**: Images, fonts, and other static assets.

## Built With

*   [React Native](https://reactnative.dev/)
*   [Expo](https://expo.dev/)
*   [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing.
*   [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design library.
*   [Axios](https://axios-http.com/) - Promise based HTTP client.
