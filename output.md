My project is CareSphere, which is a Hospital Management System. This project is built using React, Vite, and Supabase. The main purpose of this system is to digitally manage different hospital operations such as patient appointments, user management, ward management, public program requests, and wardboy task assignment.

First, the home page appears, where the hospital introduction, departments, facilities, doctors, and testimonials are displayed. After that, a user can log in or sign up. The Sign Up page is for portal account access, while the Clinical Programs page is for special public requests such as Clinical Observer, Nursing Intern, Admin Trainee, and Community Volunteer.

The most important feature of this project is the role-based dashboard. It includes six roles: Admin, Doctor, Nurse, Receptionist, Patient, and Wardboy. Each role has a separate dashboard with limited permissions.

A patient can book an appointment. When the patient clicks on Appointment, after login they are directly redirected to the appointment page. The system checks 15-minute intervals and also validates the doctor's shift. If the selected doctor is not available, the patient can either choose a random doctor or select a different time.

In the Admin dashboard, users can be managed, wards and departments can be handled, program requests can be approved or rejected, appointments can be controlled, and wardboy tasks can be assigned. Doctors can approve or reject their appointments. Wardboys receive assigned tasks in an active list, and once completed, the tasks are saved in history.

The academic focus of this project is Black Box Testing, where the system is tested based on inputs and expected outputs. This means the system behavior is validated without analyzing internal code.
