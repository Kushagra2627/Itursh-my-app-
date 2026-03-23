Itursh – Property Rental Mobile Application

Itursh is a full-stack property rental and booking mobile application where users can discover rental properties, view details, and request bookings. The system includes an admin approval workflow, booking status tracking, and property availability management.

The application consists of a mobile user app, backend API server, database, and admin management system.

Features
-User signup and login
-Discover rental properties
-Horizontal swipe property browsing
-Property detail view with images
-Booking request system
-Booking status (Pending, Approved, Booked)
-Property lock system (In Process)
-Admin approval workflow
-My Bookings screen
-Profile screen with support and feedback
-Pull to refresh and auto refresh
-Android back navigation handling
-Image uploads for properties
-Backend API with Prisma and PostgreSQL

Tech Stack

Frontend (Mobile App)

React Native
Expo
Expo Router
Axios

Backend

Node.js
Express.js
Prisma ORM
PostgreSQL

Other

JWT Authentication
Image Uploads
REST API
EAS Build (APK)
Booking Workflow

Pending → Approved → Booked → Property Removed from Listing

Project Structure
itursh/
 ├── mobile/      (Expo React Native app)
 ├── backend/     (Node.js + Express + Prisma API)
 ├── admin/       (Admin panel)
 └── database/    (Prisma schema)
 
Future Improvements(optional)
Payment integration
Push notifications
Reviews & ratings
Chat between tenant and owner
Cloud image storage
Play Store deployment

