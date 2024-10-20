**Project Title:**
StudyBox.1 - Learning Platform for Sharing Study Resources

**Project Description**
- StudyBox is a web-based platform designed to help students seamlessly share and access academic resources from their peers.
  This project aims to bridge the gap in resource sharing and simplify the collaboration process among students.
- Built with Node.js, Express.js, and MongoDB, the platform offers a user-friendly experience for uploading, downloading, and sharing study materials like notes, assignments, and other documents.
- The platform supports robust functionalities such as real-time notifications for file sharing, file management, and search capabilities.
- StudyBox is particularly suited for educational environments where students often need quick and reliable access to learning materials.
  
**Features:**
*User Authentication:*
- Secure login and registration system using session management and password encryption.
- Only authorized users can upload, share, or download files.
- Displays error messages for incorrect login credentials.

*File Upload and Sharing:*
- Students can upload files along with optional descriptions.
- Files can be shared directly with peers via email, and notifications are sent when files are shared.
- Supports downloading and viewing files in supported formats like Google Docs or Office Online.

*Notifications:*
- Real-time notifications system that alerts users when a file is shared with them.

*Search Functionality:*
- Powerful search feature to locate files based on their name or description.
- Allows users to quickly find the specific study materials they need.

*File Management:*
- Users can view their uploaded files, manage them by updating or deleting records.
- View files that have been shared with them by others in a dedicated "Shared With Me" section.

*Technologies Used:*
- Backend: Node.js with Express.js for server-side routing and logic.
- Frontend: HTML, CSS, Bootstrap, and EJS for templating.
- Database: MongoDB for data storage and retrieval.
- Email Notifications: Nodemailer for sending notifications when files are shared.
- Authentication: bcrypt for hashing passwords to secure user information.
- File Management: express-formidable for handling file uploads and form data.

*How to Run the Project:*
- Clone the Repository
- Install Dependencies
- Set Up MongoDB:
Ensure MongoDB is installed and running.
Create a database called StudyBox for the project to connect to.
- Configure Email (Optional):
Add your own email credentials in the server.js file under the Nodemailer configuration to send notifications.
- Start the Server
Access the Application: Open your browser and go to http://localhost:3000 to start using StudyBox.

*Future Improvements:*
- Role-Based Authentication: Implementation of different access levels (e.g., Admin vs. Regular Users).
- REST API: Introduction of a REST API for easy integration with mobile apps or external systems.
- Cloud Storage: Move file storage to a cloud-based solution like AWS S3 to support better scalability.

Demo Link:
Demo

Contributing:
- Feel free to fork this repository and contribute by submitting a pull request.

