-- CareSphere sample staff seed for the current public.users schema.
-- These rows create profile records for doctors, nurses, ward boys, and receptionists.
-- Staff can later be linked to real Supabase Auth accounts using the signup flow or admin user creation.

with staff_seed (
  name,
  email,
  role,
  department,
  gender,
  shift,
  shift_start,
  shift_end,
  qualification,
  specialization,
  experience,
  salary,
  phone
) as (
  values
    ('Dr. Ayesha Khan', 'dr.ayesha.khan@caresphere.pk', 'doctor', 'Emergency', 'Female', 'Morning OPD', '09:00', '14:00', 'MBBS, FCPS', 'Emergency Medicine', 8, 350000, '03001110001'),
    ('Dr. Bilal Ahmed', 'dr.bilal.ahmed@caresphere.pk', 'doctor', 'Emergency', 'Male', 'Evening OPD', '14:00', '20:00', 'MBBS, MCPS', 'Emergency Medicine', 6, 320000, '03001110002'),
    ('Dr. Sana Iqbal', 'dr.sana.iqbal@caresphere.pk', 'doctor', 'Surgical', 'Female', 'Morning OPD', '09:00', '14:00', 'MBBS, FCPS', 'General Surgery', 9, 360000, '03002220001'),
    ('Dr. Kamran Saleem', 'dr.kamran.saleem@caresphere.pk', 'doctor', 'Surgical', 'Male', 'Evening OPD', '14:00', '20:00', 'MBBS, MS', 'General Surgery', 7, 330000, '03002220002'),
    ('Dr. Farah Sheikh', 'dr.farah.sheikh@caresphere.pk', 'doctor', 'Pediatrics', 'Female', 'Morning OPD', '09:00', '14:00', 'MBBS, DCH', 'Pediatrics', 10, 345000, '03003330001'),
    ('Dr. Faisal Nawaz', 'dr.faisal.nawaz@caresphere.pk', 'doctor', 'Pediatrics', 'Male', 'Evening OPD', '14:00', '20:00', 'MBBS, FCPS', 'Pediatrics', 6, 315000, '03003330002'),
    ('Dr. Hassan Saeed', 'dr.hassan.saeed@caresphere.pk', 'doctor', 'Orthopedics', 'Male', 'Morning OPD', '09:00', '14:00', 'MBBS, MS', 'Orthopedic Surgery', 11, 370000, '03004440001'),
    ('Dr. Rabia Aslam', 'dr.rabia.aslam@caresphere.pk', 'doctor', 'Orthopedics', 'Female', 'Evening OPD', '14:00', '20:00', 'MBBS, FCPS', 'Orthopedics', 7, 335000, '03004440002'),
    ('Dr. Khadija Rehman', 'dr.khadija.rehman@caresphere.pk', 'doctor', 'Radiology', 'Female', 'Morning Imaging', '09:00', '14:00', 'MBBS, FCPS', 'Radiology', 8, 355000, '03005550001'),
    ('Dr. Waqas Munir', 'dr.waqas.munir@caresphere.pk', 'doctor', 'Radiology', 'Male', 'Evening Imaging', '14:00', '20:00', 'MBBS, MCPS', 'Radiology', 6, 325000, '03005550002'),

    ('Asma Tariq', 'nurse.asma.tariq@caresphere.pk', 'nurse', 'Emergency', 'Female', 'Morning Ward', '07:00', '15:00', 'RN, BSN', null, 5, 120000, '03111110001'),
    ('Zainab Ali', 'nurse.zainab.ali@caresphere.pk', 'nurse', 'Emergency', 'Female', 'Evening Ward', '15:00', '23:00', 'RN', null, 4, 115000, '03111110002'),
    ('Noreen Waqar', 'nurse.noreen.waqar@caresphere.pk', 'nurse', 'Surgical', 'Female', 'Morning Ward', '07:00', '15:00', 'RN, BSN', null, 6, 125000, '03112220001'),
    ('Samina Gul', 'nurse.samina.gul@caresphere.pk', 'nurse', 'Surgical', 'Female', 'Evening Ward', '15:00', '23:00', 'RN', null, 5, 118000, '03112220002'),
    ('Uzma Khalid', 'nurse.uzma.khalid@caresphere.pk', 'nurse', 'Pediatrics', 'Female', 'Morning Ward', '07:00', '15:00', 'RN, BSN', null, 7, 122000, '03113330001'),
    ('Shazia Parveen', 'nurse.shazia.parveen@caresphere.pk', 'nurse', 'Pediatrics', 'Female', 'Evening Ward', '15:00', '23:00', 'RN', null, 5, 117000, '03113330002'),
    ('Aneela Qadir', 'nurse.aneela.qadir@caresphere.pk', 'nurse', 'Orthopedics', 'Female', 'Morning Ward', '07:00', '15:00', 'RN, BSN', null, 6, 121000, '03114440001'),
    ('Mehwish Hayat', 'nurse.mehwish.hayat@caresphere.pk', 'nurse', 'Orthopedics', 'Female', 'Evening Ward', '15:00', '23:00', 'RN', null, 4, 116000, '03114440002'),
    ('Madiha Iftikhar', 'nurse.madiha.iftikhar@caresphere.pk', 'nurse', 'Radiology', 'Female', 'Morning Ward', '07:00', '15:00', 'RN, BSN', null, 5, 119000, '03115550001'),
    ('Anum Fayyaz', 'nurse.anum.fayyaz@caresphere.pk', 'nurse', 'Radiology', 'Female', 'Evening Ward', '15:00', '23:00', 'RN', null, 4, 114000, '03115550002'),

    ('Ahmed Ali', 'wardboy.ahmed.ali@caresphere.pk', 'wardboy', 'Emergency', 'Male', 'Support Shift', '08:00', '17:00', null, null, 3, 65000, '03221110001'),
    ('Hasan Zafar', 'wardboy.hasan.zafar@caresphere.pk', 'wardboy', 'Surgical', 'Male', 'Support Shift', '08:00', '17:00', null, null, 4, 67000, '03222220001'),
    ('Zaid Hameed', 'wardboy.zaid.hameed@caresphere.pk', 'wardboy', 'Pediatrics', 'Male', 'Support Shift', '08:00', '17:00', null, null, 2, 62000, '03223330001'),
    ('Sheheryar Munawar', 'wardboy.sheheryar.munawar@caresphere.pk', 'wardboy', 'Orthopedics', 'Male', 'Support Shift', '08:00', '17:00', null, null, 5, 69000, '03224440001'),
    ('Danish Taimoor', 'wardboy.danish.taimoor@caresphere.pk', 'wardboy', 'Radiology', 'Male', 'Support Shift', '08:00', '17:00', null, null, 3, 64000, '03225550001'),

    ('Sana Receptionist', 'reception.sana@caresphere.pk', 'receptionist', 'Emergency', 'Female', 'Front Desk', '08:00', '16:00', 'B.Com', null, 4, 90000, '03331110001'),
    ('Bilal Receptionist', 'reception.bilal@caresphere.pk', 'receptionist', 'Surgical', 'Male', 'Front Desk', '12:00', '20:00', 'BBA', null, 5, 95000, '03332220001')
)
insert into public.users (
  auth_user_id,
  email,
  name,
  role,
  department,
  depid,
  phone,
  gender,
  shift,
  shift_start,
  shift_end,
  qualification,
  specialization,
  experience,
  salary,
  status,
  auth_status,
  removed_at
)
select
  null::uuid,
  lower(staff_seed.email),
  staff_seed.name,
  staff_seed.role,
  staff_seed.department,
  departments.id,
  staff_seed.phone,
  staff_seed.gender,
  staff_seed.shift,
  staff_seed.shift_start,
  staff_seed.shift_end,
  staff_seed.qualification,
  staff_seed.specialization,
  staff_seed.experience,
  staff_seed.salary,
  'Active',
  'active',
  null::timestamptz
from staff_seed
left join public.departments
  on departments.name = staff_seed.department
on conflict (email) do update
set name = excluded.name,
    role = excluded.role,
    department = excluded.department,
    depid = excluded.depid,
    phone = excluded.phone,
    gender = excluded.gender,
    shift = excluded.shift,
    shift_start = excluded.shift_start,
    shift_end = excluded.shift_end,
    qualification = excluded.qualification,
    specialization = excluded.specialization,
    experience = excluded.experience,
    salary = excluded.salary,
    status = 'Active',
    auth_status = case
      when public.users.auth_user_id is not null then public.users.auth_status
      else excluded.auth_status
    end,
    removed_at = null,
    updated_at = now();

select role, department, count(*) as total_staff
from public.users
where role in ('doctor', 'nurse', 'wardboy', 'receptionist')
group by role, department
order by role, department;
