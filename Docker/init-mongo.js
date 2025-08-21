// 1) Create the root user in the admin database
var adminDB = db.getSiblingDB('admin');
adminDB.createUser({
  user: "admin",
  pwd:  "admin",
  roles: [ { role: "root", db: "admin" } ]
});

// 2) Switch to your application database
var appDB = db.getSiblingDB('domecare_dev');

// 3) Create collections
["users","doctors","patients","appointments","prescriptions","medicines","verification_tokens","audit_logs"]
  .forEach(name => appDB.createCollection(name));

// 4) Create indexes
appDB.users.createIndex({ email: 1 }, { sparse: true, unique: true });
appDB.users.createIndex({ phone_number: 1, country_code: 1 }, { sparse: true });
appDB.users.createIndex({ role: 1 });
appDB.users.createIndex({ status: 1 });

appDB.appointments.createIndex({ doctor_id: 1 });
appDB.appointments.createIndex({ patient_id: 1 });
appDB.appointments.createIndex({ appointment_date: 1 });
appDB.appointments.createIndex({ status: 1 });
appDB.appointments.createIndex({ doctor_id: 1, appointment_date: 1, "time_slot.start_time": 1 }, { unique: true });

appDB.prescriptions.createIndex({ doctor_id: 1 });
appDB.prescriptions.createIndex({ patient_id: 1 });
appDB.prescriptions.createIndex({ created_at: -1 });
appDB.prescriptions.createIndex({ prescription_number: 1 }, { unique: true });

appDB.verification_tokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
appDB.verification_tokens.createIndex({ user_id: 1 });
appDB.verification_tokens.createIndex({ token: 1 });

appDB.medicines.createIndex({ name: 1 });
appDB.medicines.createIndex({ name_ar: 1 });
appDB.medicines.createIndex({ category: 1 });

// 5) Insert comprehensive medicine database
appDB.medicines.insertMany([
  // Pain Relief & Anti-inflammatory
  {
    name: "Paracetamol",
    name_ar: "باراسيتامول",
    dosage_forms: ["500mg", "1000mg", "125mg/5ml syrup"],
    category: "Analgesic",
    description: "Pain reliever and fever reducer"
  },
  {
    name: "Ibuprofen",
    name_ar: "إيبوبروفين",
    dosage_forms: ["200mg", "400mg", "600mg", "100mg/5ml syrup"],
    category: "NSAID",
    description: "Anti-inflammatory, pain reliever, fever reducer"
  },
  {
    name: "Aspirin",
    name_ar: "أسبرين",
    dosage_forms: ["75mg", "100mg", "325mg"],
    category: "NSAID",
    description: "Pain reliever, anti-inflammatory, blood thinner"
  },
  {
    name: "Diclofenac",
    name_ar: "ديكلوفيناك",
    dosage_forms: ["25mg", "50mg", "75mg", "1% gel"],
    category: "NSAID",
    description: "Anti-inflammatory pain reliever"
  },

  // Antibiotics
  {
    name: "Amoxicillin",
    name_ar: "أموكسيسيلين",
    dosage_forms: ["250mg", "500mg", "875mg", "125mg/5ml syrup"],
    category: "Antibiotic",
    description: "Penicillin antibiotic for bacterial infections"
  },
  {
    name: "Azithromycin",
    name_ar: "أزيثروميسين",
    dosage_forms: ["250mg", "500mg", "200mg/5ml syrup"],
    category: "Antibiotic",
    description: "Macrolide antibiotic for respiratory infections"
  },
  {
    name: "Ciprofloxacin",
    name_ar: "سيبروفلوكساسين",
    dosage_forms: ["250mg", "500mg", "750mg"],
    category: "Antibiotic",
    description: "Fluoroquinolone antibiotic for various infections"
  },
  {
    name: "Cephalexin",
    name_ar: "سيفالكسين",
    dosage_forms: ["250mg", "500mg", "125mg/5ml syrup"],
    category: "Antibiotic",
    description: "Cephalosporin antibiotic for skin and soft tissue infections"
  },

  // Cardiovascular
  {
    name: "Amlodipine",
    name_ar: "أملوديبين",
    dosage_forms: ["2.5mg", "5mg", "10mg"],
    category: "Antihypertensive",
    description: "Calcium channel blocker for high blood pressure"
  },
  {
    name: "Metoprolol",
    name_ar: "ميتوبرولول",
    dosage_forms: ["25mg", "50mg", "100mg"],
    category: "Beta-blocker",
    description: "Beta-blocker for heart conditions and blood pressure"
  },
  {
    name: "Lisinopril",
    name_ar: "ليسينوبريل",
    dosage_forms: ["2.5mg", "5mg", "10mg", "20mg"],
    category: "ACE Inhibitor",
    description: "ACE inhibitor for blood pressure and heart failure"
  },
  {
    name: "Atorvastatin",
    name_ar: "أتورفاستاتين",
    dosage_forms: ["10mg", "20mg", "40mg", "80mg"],
    category: "Statin",
    description: "Cholesterol-lowering medication"
  },

  // Diabetes
  {
    name: "Metformin",
    name_ar: "ميتفورمين",
    dosage_forms: ["500mg", "850mg", "1000mg"],
    category: "Antidiabetic",
    description: "First-line medication for type 2 diabetes"
  },
  {
    name: "Glimepiride",
    name_ar: "جليميبيريد",
    dosage_forms: ["1mg", "2mg", "4mg"],
    category: "Antidiabetic",
    description: "Sulfonylurea for type 2 diabetes"
  },

  // Respiratory
  {
    name: "Salbutamol",
    name_ar: "سالبوتامول",
    dosage_forms: ["100mcg inhaler", "2mg tablet", "2mg/5ml syrup"],
    category: "Bronchodilator",
    description: "Beta-2 agonist for asthma and COPD"
  },
  {
    name: "Montelukast",
    name_ar: "مونتيلوكاست",
    dosage_forms: ["4mg", "5mg", "10mg"],
    category: "Leukotriene Inhibitor",
    description: "Asthma and allergy medication"
  },
  {
    name: "Prednisolone",
    name_ar: "بريدنيزولون",
    dosage_forms: ["5mg", "10mg", "25mg", "15mg/5ml syrup"],
    category: "Corticosteroid",
    description: "Anti-inflammatory steroid"
  },

  // Gastrointestinal
  {
    name: "Omeprazole",
    name_ar: "أوميبرازول",
    dosage_forms: ["10mg", "20mg", "40mg"],
    category: "Proton Pump Inhibitor",
    description: "Reduces stomach acid production"
  },
  {
    name: "Ranitidine",
    name_ar: "رانيتيدين",
    dosage_forms: ["150mg", "300mg", "75mg/5ml syrup"],
    category: "H2 Receptor Antagonist",
    description: "Reduces stomach acid"
  },
  {
    name: "Loperamide",
    name_ar: "لوبيراميد",
    dosage_forms: ["2mg"],
    category: "Antidiarrheal",
    description: "Treatment for diarrhea"
  },

  // Antihistamines
  {
    name: "Cetirizine",
    name_ar: "سيتيريزين",
    dosage_forms: ["5mg", "10mg", "5mg/5ml syrup"],
    category: "Antihistamine",
    description: "Allergy medication"
  },
  {
    name: "Loratadine",
    name_ar: "لوراتادين",
    dosage_forms: ["5mg", "10mg", "5mg/5ml syrup"],
    category: "Antihistamine",
    description: "Non-drowsy allergy medication"
  },
  {
    name: "Chlorpheniramine",
    name_ar: "كلورفينيرامين",
    dosage_forms: ["4mg", "2mg/5ml syrup"],
    category: "Antihistamine",
    description: "First-generation antihistamine"
  },

  // Vitamins & Supplements
  {
    name: "Vitamin D3",
    name_ar: "فيتامين د3",
    dosage_forms: ["1000 IU", "2000 IU", "5000 IU", "drops"],
    category: "Vitamin",
    description: "Vitamin D supplement"
  },
  {
    name: "Vitamin B12",
    name_ar: "فيتامين ب12",
    dosage_forms: ["500mcg", "1000mcg", "injection"],
    category: "Vitamin",
    description: "Vitamin B12 supplement"
  },
  {
    name: "Iron Sulfate",
    name_ar: "كبريتات الحديد",
    dosage_forms: ["200mg", "325mg", "syrup"],
    category: "Mineral",
    description: "Iron supplement for anemia"
  },
  {
    name: "Calcium Carbonate",
    name_ar: "كربونات الكالسيوم",
    dosage_forms: ["500mg", "600mg", "1000mg"],
    category: "Mineral",
    description: "Calcium supplement"
  },

  // Antifungals
  {
    name: "Fluconazole",
    name_ar: "فلوكونازول",
    dosage_forms: ["50mg", "100mg", "150mg", "200mg"],
    category: "Antifungal",
    description: "Antifungal medication for yeast infections"
  },
  {
    name: "Clotrimazole",
    name_ar: "كلوتريمازول",
    dosage_forms: ["1% cream", "1% solution", "10mg tablet"],
    category: "Antifungal",
    description: "Topical antifungal for skin infections"
  },

  // Mental Health
  {
    name: "Sertraline",
    name_ar: "سيرترالين",
    dosage_forms: ["25mg", "50mg", "100mg"],
    category: "Antidepressant",
    description: "SSRI antidepressant"
  },
  {
    name: "Alprazolam",
    name_ar: "ألبرازولام",
    dosage_forms: ["0.25mg", "0.5mg", "1mg"],
    category: "Anxiolytic",
    description: "Benzodiazepine for anxiety"
  },

  // Eye Care
  {
    name: "Artificial Tears",
    name_ar: "دموع اصطناعية",
    dosage_forms: ["0.5% drops", "1% gel"],
    category: "Ophthalmologic",
    description: "Lubricating eye drops"
  },
  {
    name: "Tobramycin",
    name_ar: "توبراميسين",
    dosage_forms: ["0.3% eye drops", "0.3% ointment"],
    category: "Antibiotic",
    description: "Antibiotic eye drops"
  }
]);

// 6) Create sample doctor profile with specialties and schedule
appDB.users.insertOne({
  full_name: "Dr. Ahmed Hassan",
  email: "dr.ahmed@domecare.sy",
  password_hash: "$2b$12$LQv3c1yqBwKVHrPp5B8cu.6P9W8YO6MqQUpqJyPq7XsVkjCCJOkWu", // "password123"
  role: "doctor",
  status: "active",
  auth_method: "email",
  is_email_verified: true,
  profile_completed: true,
  documents_verified: true,
  specialties: [
    {
      main_specialty: "General Medicine",
      sub_specialty: "Internal Medicine",
      verification_status: "verified"
    }
  ],
  bio: "Experienced general practitioner with 10+ years in internal medicine. Specialized in preventive care and chronic disease management.",
  years_of_experience: 12,
  clinic_info: {
    session_duration: 30,
    schedule: {
      "sunday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "09:00", "end_time": "12:00" },
          { "start_time": "16:00", "end_time": "20:00" }
        ]
      },
      "monday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "09:00", "end_time": "12:00" },
          { "start_time": "16:00", "end_time": "20:00" }
        ]
      },
      "tuesday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "09:00", "end_time": "12:00" },
          { "start_time": "16:00", "end_time": "20:00" }
        ]
      },
      "wednesday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "09:00", "end_time": "12:00" },
          { "start_time": "16:00", "end_time": "20:00" }
        ]
      },
      "thursday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "09:00", "end_time": "12:00" },
          { "start_time": "16:00", "end_time": "20:00" }
        ]
      },
      "friday": {
        "is_working": false,
        "time_slots": []
      },
      "saturday": {
        "is_working": true,
        "time_slots": [
          { "start_time": "10:00", "end_time": "14:00" }
        ]
      }
    },
    city: "Damascus",
    area: "Mezzeh",
    detailed_address: "Mezzeh Autoestrade, Building 15, Floor 3",
    clinic_phone: "+963-11-1234567",
    clinic_email: "clinic@domecare.sy",
    consultation_fee: 2000,
    currency: "SYP"
  },
  rating: 4.8,
  reviews_count: 156,
  total_patients: 89,
  total_appointments: 234,
  created_at: new Date(),
  updated_at: new Date()
});

print('Database, indexes, sample data, and doctor profile initialized successfully');

print('Sample doctor login: dr.ahmed@domecare.sy / password123');
print('Doctor specializes in General Medicine with clinic in Damascus, Mezzeh');
print('Working hours: Sun-Thu 9:00-12:00 & 16:00-20:00, Sat 10:00-14:00');
print('Medicine database contains ' + appDB.medicines.count() + ' medications');