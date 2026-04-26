/* global require */
const fs = require('fs');

const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  NURSE: 'nurse',
  PATIENT: 'patient',
  WARDBOY: 'wardboy'
};

const DEPARTMENTS = [
  'Emergency', 'Surgical', 'Pediatrics', 'Orthopedics', 'Radiology'
];

const PAK_NAMEDOC = ['Tariq Mahmood', 'Ayesha Khan', 'Usman Raza', 'Fatima Ali', 'Bilal Ahmed', 'Sana Iqbal', 'Imran Shah', 'Hira Qadri', 'Kamran Saleem', 'Nadia Jamil', 'Raza Malik', 'Farah Sheikh', 'Zahid Hussain', 'Nida Tariq', 'Faisal Nawaz', 'Hassan Saeed', 'Amna Dar', 'Salman Qureshi', 'Rabia Aslam', 'Shoaib Akhtar', 'Khadija Rehman', 'Waqas Munir', 'Marium Riaz', 'Junaid Safdar', 'Sahar Zaman'];
const PAK_NAMENURSE = ['Asma Tariq', 'Zainab Ali', 'Sadia Imran', 'Maria Qasim', 'Kiran Shah', 'Noreen Waqar', 'Samina Gul', 'Lubna Javed', 'Bushra Ansari', 'Tayyaba Noor', 'Uzma Khalid', 'Shazia Parveen', 'Rida Batool', 'Nida Zafar', 'Sonia Majeed', 'Aneela Qadir', 'Mehwish Hayat', 'Ayesha Omer', 'Humaira Chohan', 'Saba Qamar', 'Madiha Iftikhar', 'Anum Fayyaz', 'Sanam Jung', 'Maya Ali', 'Mahira Khan'];
const PAK_NAMEWARD = ['Ahmed Ali', 'Ali Raza', 'Hasan Zafar', 'Umar Farooq', 'Zaid Hameed', 'Hamza Abbasi', 'Sheheryar Munawar', 'Fahad Mustafa', 'Danish Taimoor', 'Imran Abbas'];

let sql = `-- CareSphere Data Seed\n\n`;

// Admin
sql += `INSERT INTO Admins (Username, PasswordHash, Role) VALUES ('brisco.official@gmail.com', 'Usman.brisco123', 'admin');\n`;

// Patient
sql += `INSERT INTO Patient (PName, Gender, Email, PasswordHash, PhoneNo, Address) VALUES ('Ali Patient', 'Male', 'patient@caresphere.pk', 'password', '03001234567', 'DHA Phase 5, Lahore');\n`;

// Receptionists
sql += `INSERT INTO Receptionist (Name, Depid, Gender, Email, PasswordHash, PhoneNo) VALUES \n`;
sql += `('Sana Receptionist', 1, 'Female', 'recep1@caresphere.pk', 'password', '03219876543'),\n`;
sql += `('Bilal Receptionist', 2, 'Male', 'recep2@caresphere.pk', 'password', '03219876544');\n`;

// Doctors, Nurses, Wardboys
DEPARTMENTS.forEach((dept, deptIdx) => {
    const depId = deptIdx + 1;
    
    // Doctors
    sql += `\n-- ${dept} Doctors\n`;
    sql += `INSERT INTO Doctor (Name, Depid, Gender, Email, PasswordHash, Specialization, Experience) VALUES \n`;
    const docInserts = [];
    for(let i=0; i<5; i++) {
        const name = PAK_NAMEDOC[(deptIdx*5 + i)%PAK_NAMEDOC.length];
        const email = `doc.${name.toLowerCase().replace(/\s+/g, '.')}@caresphere.pk`;
        docInserts.push(`('Dr. ${name}', ${depId}, '${i%2===0?'Male':'Female'}', '${email}', 'password', '${dept} Specialist', ${5 + i})`);
    }
    sql += docInserts.join(',\n') + ';\n';

    // Nurses
    sql += `\n-- ${dept} Nurses\n`;
    sql += `INSERT INTO Nurse (NurseName, Depid, Gender, Email, PasswordHash, Shift) VALUES \n`;
    const nurseInserts = [];
    for(let i=0; i<5; i++) {
        const name = PAK_NAMENURSE[(deptIdx*5 + i)%PAK_NAMENURSE.length];
        const email = `nurse.${name.toLowerCase().replace(/\s+/g, '.')}@caresphere.pk`;
        nurseInserts.push(`('${name}', ${depId}, 'Female', '${email}', 'password', '${i%2===0?'Morning':'Night'}')`);
    }
    sql += nurseInserts.join(',\n') + ';\n';

    // Wardboys
    sql += `\n-- ${dept} Wardboys\n`;
    sql += `INSERT INTO WardBoy (WardBName, Depid, Gender, Email, PasswordHash, Shift) VALUES \n`;
    const wardInserts = [];
    for(let i=0; i<2; i++) {
        const name = PAK_NAMEWARD[(deptIdx*2 + i)%PAK_NAMEWARD.length];
        const email = `wardboy.${name.toLowerCase().replace(/\s+/g, '.')}@caresphere.pk`;
        wardInserts.push(`('${name}', ${depId}, 'Male', '${email}', 'password', 'Rotational')`);
    }
    sql += wardInserts.join(',\n') + ';\n';
});

fs.writeFileSync('seed_data.sql', sql);
console.log('seed_data.sql generated successfully!');
