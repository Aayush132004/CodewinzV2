CodeWinz: Project Explanation

DemoVideo(in case site got down or slow) https://youtu.be/kQsRq8MC3UU

live site link:https://codewinzv2-production-8429.up.railway.app/

Overview
CodeWinz is a full-stack, production-grade online coding platform built to support Data Structures and Algorithms (DSA) practice, collaborative problem solving, AI-powered coding assistance, competitive coding events, and community interaction. The platform is designed with scalability, real-time features, and secure authentication mechanisms using modern technologies.

Key Features
1. DSA Practice Platform
Built-in Monaco Editor to write and run code.


Track submissions per problem.


Language Support: Java, C++, JavaScript.


Integrated test case validation.


Solution and video explanation unlocked post-problem solving.


2. Collaborative Coding
Built using Socket.IO.


Real-time shared editor and live cursor support.


Invite a friend to solve problems together if friend isauthenticated you see his name else guest
Submission and language change by host only


3. AI Code Assistant
Powered by Gemini 2.5 Flash.


Provides focused assistance for specific DSA problems only.


Avoids distractions by filtering out non-relevant responses.


4. Timed Coding Competitions
Real-time contests with time tracking.


Dynamic scoring and ranking system based on problem difficulty.


Live scoreboard updates.
Ranking system (Based on dragon ball Z theme )
Contest based on fixed points to qn based on difficulty


5. Community Chat Support
Open chatroom for general queries.


Ask doubts to peers and available mentors.


Real-time communication via Socket.IO.


6. Production-Level Authentication
Normal login with JWT token and persistent sessions


Magic link login via NodeMailer.


Google One Tap OAuth login using Google SDK.


Redis blocklist to ensure secure logout handling.


6.Admin panel
Create new problems 
Create contests
Upload video solutions of problems
Update problems
Delete problems 
  

Technology Stack
Component
Technology
Frontend
React.js (with JavaScript), Tailwind CSS,Daisy UI,Lucide-react icons
Code Editor
Code running environment    
Monaco Editor
Judge 0


Real-Time Communication
Socket.IO
Backend
Node.js, Express.js
AI Assistant
Gemini 2.5 Flash
Authentication
JWT, Redis, Nodemailer, Google One Tap SDK
Database
MongoDB ,Cloudinary(CDN)
Deployment
Railway


High-Level System Architecture
Block Diagram

                  
                       


Component Breakdown
🔹 Frontend (React + JavaScript)
User-friendly interface for all modules.


Monaco-based code editor.


Responsive design using Tailwind CSS.


Language toggle support .


🔹 Authentication Module
JWT-based session management.


Redis for token invalidation on logout.


Nodemailer to send magic login links.


Google OAuth via Google One Tap SDK.


🔹 DSA Module
MongoDB stores problems, submissions, test cases.


API endpoints to fetch problems, submit code, check test cases.


Code execution service (language runtime in backend).


🔹 Collaborative Coding
Real-time code sync via Socket.IO rooms.


Live cursor and session-aware coding.


Anonymous or authenticated session join.


🔹 AI Assistant
Gemini 2.5 Flash responds to problem-related queries only.


Integrated inside problem page as coding helper.


🔹 Competitions Module
Countdown timers and duration enforcement.


Leaderboard updates based on submissions and score logic.


🔹 Community Chat
Open chat interface with Socket.IO channels.


Optionally filtered by tags or difficulty levels.



Future Enhancements
Contest hosting by users.


Mobile-optimized coding experience.


User profile with analytics and badges.
Payment gateway integration






Summary
CodeWinz merges modern technologies with real-time interaction, AI-assisted problem solving, and secure authentication to deliver a focused, production-level coding practice platform. With collaborative problem solving and competitive features, it's an ideal choice for individual learners and coding groups alike.


