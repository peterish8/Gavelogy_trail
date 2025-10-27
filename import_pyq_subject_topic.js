// Import script for PYQ Subject-Topic mapping
// Usage: node import_pyq_subject_topic.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables (you'll need dotenv package)
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV data for 2020 PYQ subject-topic mapping
const subjectTopicData = `QuestionNumber,Subject,Topic
1,Constitutional Law,Reservation Policy
2,Constitutional Law,Article 16
3,Constitutional Law,"Reservation, 50% Cap"
4,Constitutional Law,"Service Law, Reservation in Promotion"
5,Constitutional Law,Article 16
6,Constitutional Law,Article 16
7,Constitutional Law,"Service Law, Reservation in Promotion"
8,Constitutional Law,"Reservation, Creamy Layer"
9,Constitutional Law,Reservation
10,Constitutional Law,Reservation in Education
11,Law of Contempt,
12,Constitutional Law,"Law of Contempt, Article 129"
13,Law of Contempt,Defences
14,Law of Contempt,
15,Law of Contempt,
16,Constitutional Law,"Article 19, Comparative Constitutional Law"
17,Constitutional Law,"Law of Contempt, Article 19"
18,Law of Contempt,
19,Law of Contempt,
20,Constitutional Law,"Parliamentary Privileges, Article 105"
21,Constitutional Law,"Right to Privacy, Article 21"
22,Constitutional Law,Article 21
23,Constitutional Law,"Legal Maxims, History of Privacy"
24,Constitutional Law,"Right to Privacy, Case Law"
25,Constitutional Law,Right to Privacy
26,Constitutional Law,Scope of Fundamental Rights
27,Constitutional Law,"Right to Privacy, Article 21"
28,Constitutional Law,"Information Technology Law, Data Privacy"
29,Constitutional Law,Scope of Article 21
30,Constitutional Law,Right to Privacy
31,Constitutional Law,"Article 19, Internet Shutdown"
32,Constitutional Law,"Administrative Law, Doctrine of Proportionality"
33,Constitutional Law,"Jurisprudence, Theory of Rights"
34,Constitutional Law,Article 19
35,Constitutional Law,"Administrative Law, Doctrine of Proportionality"
36,Constitutional Law,Reasonable Restrictions
37,Constitutional Law,"Article 19, Article 21"
38,Administrative Law,Telecommunication Law
39,Constitutional Law,"Article 3, J&K"
40,Constitutional Law,J&K Reorganisation
41,Administrative Law,Doctrine of Legitimate Expectation
42,Administrative Law,Doctrine of Legitimate Expectation
43,Administrative Law,Doctrine of Legitimate Expectation
44,Administrative Law,Judicial Review
45,Administrative Law,Principles of Natural Justice
46,Administrative Law,"Constitutional Law, Writs"
47,Administrative Law,Delegated Legislation
48,Administrative Law,Principles of Natural Justice
49,Administrative Law,"Law of Evidence, Promissory Estoppel"
50,Administrative Law,Doctrine of Legitimate Expectation
51,Constitutional Law,Judiciary
52,Constitutional Law,"Civil Procedure Code, Doctrine of Precedent"
53,Constitutional Law,"Judiciary, Master of Roster"
54,Constitutional Law,"Judiciary, Removal of Judges"
55,Constitutional Law,"Administrative Law, Judicial Administration"
56,Constitutional Law,"Article 145, Supreme Court Rules"
57,Constitutional Law,"Judicial Appointments, Three Judges Cases"
58,Jurisprudence,"Legal Maxims, Doctrine of Precedent"
59,Constitutional Law,Judiciary
60,Constitutional Law,"Judiciary, Master of Roster"
61,Labour Law,
62,Constitutional Law,"Labour Law, Distribution of Legislative Powers"
63,Labour Law,Inter-State Migrant Workmen Act
64,Labour Law,Employees' State Insurance Act
65,Labour Law,Industrial Disputes Act
66,Labour Law,"Industrial Disputes Act, Retrenchment"
67,Labour Law,Industrial Action
68,Labour Law,Industrial Disputes Act
69,Labour Law,Contract Labour Act
70,Labour Law,Contract Labour Act
71,Jurisprudence,Hohfeldian Analysis
72,Jurisprudence,"Property Law, Hohfeldian Analysis, Easements"
73,Jurisprudence,Hohfeldian Analysis
74,Jurisprudence,Hohfeldian Analysis
75,Jurisprudence,"Constitutional Law, Hohfeldian Analysis"
76,Jurisprudence,"Constitutional Law, Hohfeldian Analysis"
77,Jurisprudence,"Civil Procedure Code, Hohfeldian Analysis"
78,Jurisprudence,"Public International Law, Hohfeldian Analysis"
79,Jurisprudence,"Law of Contract, Hohfeldian Analysis"
80,Jurisprudence,"Constitutional Law, Hohfeldian Analysis"
81,Jurisprudence,Legal Theory
82,Jurisprudence,"Legal Theory, Hobbes"
83,Jurisprudence,"Legal Theory, Habermas"
84,Jurisprudence,"Legal Theory, Fuller"
85,Jurisprudence,
86,Jurisprudence,"Legal Theory, Stammler"
87,Jurisprudence,"Legal Theory, Habermas"
88,Jurisprudence,"Legal Theory, Habermas"
89,Jurisprudence,Legal Positivism
90,Jurisprudence,Legal Positivism
91,Criminal Law,Law Reform
92,Criminal Law,Indian Penal Code
93,Criminal Law,Principles of Criminal Law
94,Criminal Law,"Criminology, Sentencing Policy"
95,Criminal Law,"Criminology, Sentencing Policy"
96,Criminal Law,Capital Punishment
97,Criminal Law,"Capital Punishment, Rarest of Rare Doctrine"
98,Criminal Law,"Legal History, Indian Penal Code"
99,Criminal Law,"Indian Penal Code, Conspiracy, Unlawful Assembly"
100,Criminal Law,"Criminology, Theories of Punishment"
101,Family Law,"Muslim Law, Talaq"
102,Family Law,"Muslim Law, Shariat Application Act"
103,Family Law,"Constitutional Law, Triple Talaq, Shayara Bano Case"
104,Family Law,"Muslim Law, Types of Talaq"
105,Constitutional Law,"Family Law, Personal Law & Fundamental Rights"
106,Jurisprudence,Legal Maxims
107,Family Law,"Constitutional Law, Constitutional Law in Personal Sphere"
108,Family Law,"Hindu Law, Special Marriage Act"
109,Family Law,"Muslim Law, Khula"
110,Family Law,"Comparative Law, Divorce"
111,Public International Law,State Responsibility
112,Public International Law,International Waterways
113,Public International Law,Territorial Sovereignty
114,Public International Law,"Environmental Law, Law of the Sea"
115,Public International Law,"Sources of International Law, Custom"
116,Environmental Law,"Public International Law, Stockholm Declaration"
117,Public International Law,International Court of Justice
118,Public International Law,"Jurisprudence, Theories of International Law"
119,Environmental Law,"Public International Law, Polluter Pays Principle"
120,Public International Law,International Court of Justice`;

async function importData() {
  try {
    console.log("Starting import...");

    // Parse CSV data
    const lines = subjectTopicData.split("\n");
    const headers = lines[0].split(",");

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handling commas within quotes)
      const values = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const questionNumber = parseInt(values[0]);
      const subject = values[1] || "";
      const topic = values[2] || null;

      if (!isNaN(questionNumber) && subject) {
        records.push({
          year: 2020,
          question_number: questionNumber,
          subject: subject,
          topic: topic,
        });
      }
    }

    console.log(`Parsed ${records.length} records`);

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("pyq_subject_topic")
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(
          `Inserted batch ${i / batchSize + 1} (${batch.length} records)`
        );
      }
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Import failed:", error);
  }
}

importData();
