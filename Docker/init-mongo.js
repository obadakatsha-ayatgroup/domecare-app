// docker/init-mongo.js

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

appDB.prescriptions.createIndex({ doctor_id: 1 });
appDB.prescriptions.createIndex({ patient_id: 1 });
appDB.prescriptions.createIndex({ created_at: -1 });

appDB.verification_tokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
appDB.verification_tokens.createIndex({ user_id: 1 });
appDB.verification_tokens.createIndex({ token: 1 });

// 5) Insert mock medicines
appDB.medicines.insertMany([
  {
    name: "Paracetamol",
    name_ar: "باراسيتامول",
    dosage_forms: ["500mg", "1000mg"],
    category: "Analgesic"
  },
  {
    name: "Amoxicillin",
    name_ar: "أموكسيسيلين",
    dosage_forms: ["250mg", "500mg"],
    category: "Antibiotic"
  },
  {
    name: "Ibuprofen",
    name_ar: "إيبوبروفين",
    dosage_forms: ["200mg", "400mg", "600mg"],
    category: "NSAID"
  }
]);

print('Database and root user initialized successfully');
