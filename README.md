# Student Chat Application

A real-time chat application built with Expo (React Native) and PHP, featuring friend requests and instant messaging.

## Features

- 👥 User Authentication
- 💬 Real-time Chat
- 🤝 Friend Request System
- 🔔 Real-time Notifications
- 🎨 Modern UI Design

## Prerequisites

- [XAMPP](https://www.apachefriends.org/) (or similar local server with PHP and MySQL)
- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [MySQL](https://www.mysql.com/)

## Installation

1. Clone the repository
   ```bash
   git clone [your-repository-url]
   cd LoginApp
   ```

2. Install Node dependencies
   ```bash
   npm install
   ```

3. Database Setup
   - Start XAMPP and ensure MySQL service is running
   - Create a new database named `student_chat_db`
   - Import the database structure from `websocket/student_chat_db.sql`
   - Copy `api/db_connect.example.php` to `api/db_connect.php` and update the credentials

4. Configure WebSocket Server
   - Navigate to the websocket directory
   - Start the WebSocket server:
     ```bash
     php server.php
     ```

5. Start the Expo development server
   ```bash
   npx expo start
   ```

## Project Structure

- `/api` - PHP backend APIs
- `/app` - React Native frontend screens and components
- `/websocket` - WebSocket server for real-time communication
- `/components` - Reusable React components
- `/assets` - Images and other static assets

## Development

1. Backend Development
   - Place PHP files in the `/api` directory
   - Access APIs through `http://localhost/LoginApp/api/`

2. Frontend Development
   - Main screens are in `/app/(tabs)`
   - Components are in `/components`
   - Use the Expo development server for testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- WebSocket implementation using [Ratchet](http://socketo.me/)
- UI components inspired by modern chat applications
