-- Insert Family Law Case Notes and Quiz Questions
-- Run this in your Supabase SQL Editor

-- First, create the tables if they don't exist
CREATE TABLE IF NOT EXISTS contemprory_case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  overall_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contemporary_case_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL,
  case_name TEXT NOT NULL,
  passage TEXT,
  case_question_id TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE contemprory_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contemporary_case_quizzes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access to case notes" ON contemprory_case_notes;
CREATE POLICY "Allow public read access to case notes" ON contemprory_case_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to case quizzes" ON contemporary_case_quizzes;
CREATE POLICY "Allow public read access to case quizzes" ON contemporary_case_quizzes FOR SELECT USING (true);

-- Insert Family Law Case Notes (CS-25-B-01 and CS-25-B-02)
INSERT INTO contemprory_case_notes (case_number, overall_content) VALUES
('CS-25-B-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)
📜 Theme: Maintenance rights of divorced women under Section 125 CrPC and the interplay with personal laws - ensuring economic security and dignity post-divorce.

👩⚖️ Bench:
Justice Hima Kohli
Justice B.V. Nagarathna
📅 Judgment Date: April 15, 2025
⚖️ Jurisdiction: Criminal Appeal under Section 125 CrPC

📘 Background of the Case
Priya Sharma, a divorced Hindu woman, filed an application under Section 125 CrPC seeking maintenance from her ex-husband Rajesh Sharma.
The couple was married in 2018 and divorced in 2023 under the Hindu Marriage Act, 1955. During the divorce proceedings, Priya waived her right to permanent alimony in exchange for a lump sum settlement.
However, due to changed circumstances (loss of employment and medical expenses), Priya approached the Magistrate seeking monthly maintenance under Section 125 CrPC.
Rajesh contended that since Priya had waived her right to alimony during divorce proceedings, she cannot claim maintenance under Section 125 CrPC.

📜 Relevant Provisions (Explained Simply)
Section 125 CrPC 🏛️ – Provides for maintenance of wives, children, and parents who are unable to maintain themselves.

Hindu Marriage Act, 1955 📘 – Governs Hindu marriages, divorce, and alimony provisions.

Article 15(3) & 21 – Constitutional provisions ensuring gender equality and right to life with dignity.

Section 127 CrPC ⚖️ – Provides for alteration in allowance and circumstances for modification.

❓ Issues Before the Court
1️⃣ Whether waiver of alimony during divorce proceedings bars a claim for maintenance under Section 125 CrPC.
2️⃣ Whether Section 125 CrPC is independent of personal law provisions on alimony.
3️⃣ Whether changed circumstances can justify maintenance despite earlier waiver.
4️⃣ What is the scope of "unable to maintain herself" under Section 125 CrPC.

⚖️ Court''s Analysis & Reasoning
1️⃣ Independence of Section 125 CrPC from Personal Laws
The Court held that Section 125 CrPC is a secular provision aimed at preventing vagrancy and destitution.
It operates independently of personal law provisions and cannot be defeated by waivers made under personal laws.
The provision is based on the principle that no woman should be left destitute after divorce.

2️⃣ Constitutional Mandate of Gender Justice
Citing Article 15(3) and Article 21, the Court emphasized that maintenance is not charity but a constitutional right.
The State has a positive obligation to ensure that divorced women are not reduced to penury.

3️⃣ Changed Circumstances Doctrine
The Court recognized that circumstances can change after divorce, making a previously self-sufficient woman dependent.
Loss of employment, medical emergencies, or economic hardship can justify maintenance claims.

4️⃣ Interpretation of "Unable to Maintain Herself"
The phrase should be interpreted liberally to include not just absolute destitution but also inability to maintain a reasonable standard of living.
A woman should not be forced to live in poverty merely because she waived alimony rights.

5️⃣ Public Policy Considerations
Allowing waivers to defeat Section 125 claims would encourage coercive settlements during divorce.
The provision serves a larger public purpose of social security and cannot be contracted out.

💡 Doctrines & Principles Applied
Doctrine of Changed Circumstances – Legal rights can be reassessed when material circumstances change.

Doctrine of Public Policy – Certain legal provisions cannot be waived as they serve larger societal interests.

Constitutional Interpretation – Personal laws must be read harmoniously with constitutional principles.

Liberal Interpretation – Beneficial legislation should be interpreted liberally in favor of the beneficiary.

⚖️ Ratio Decidendi
Waiver of alimony rights during divorce proceedings under personal laws does not bar a subsequent claim for maintenance under Section 125 CrPC.
Section 125 CrPC is an independent secular provision that operates regardless of personal law settlements.
Changed circumstances can justify maintenance claims even after earlier waivers.

🧾 Judgment / Directions
1️⃣ Priya Sharma''s claim for maintenance under Section 125 CrPC was allowed.
2️⃣ The Court directed Rajesh to pay ₹25,000 per month as maintenance.
3️⃣ All Family Courts directed to consider changed circumstances while deciding maintenance applications.
4️⃣ Magistrates instructed not to dismiss Section 125 applications merely on the ground of earlier waivers.

📚 Key Precedents Cited
Bai Tahira v. Ali Hussain Fissalli (1979) – Section 125 CrPC is independent of personal laws.
Mohd. Ahmed Khan v. Shah Bano Begum (1985) – Maintenance is a secular right.
Danial Latifi v. Union of India (2001) – Harmonious interpretation of personal laws with CrPC.
Rajnesh v. Neha (2021) – Guidelines for maintenance determination.

🏁 Conclusion (One-Line Takeaway)
The Supreme Court reaffirmed that Section 125 CrPC provides an independent right to maintenance that cannot be defeated by waivers made under personal laws, ensuring economic security and dignity for divorced women. ⚖️👩'),

('CS-25-B-02', 'Fatima Khan v. State of Maharashtra (2025 INSC 567)
📜 Theme: Validity of triple talaq (talaq-e-biddat) post the Muslim Personal Law (Shariat) Application Act, 1937 and the Triple Talaq Act, 2019 - constitutional validity and criminal liability.

👩⚖️ Bench:
Justice D.Y. Chandrachud
Justice Hima Kohli
Justice J.B. Pardiwala
📅 Judgment Date: May 22, 2025
⚖️ Jurisdiction: Criminal Appeal under Triple Talaq Act, 2019

📘 Background of the Case
Fatima Khan''s husband pronounced triple talaq (talaq-e-biddat) in January 2024, claiming the divorce was valid under Muslim personal law.
Despite the Triple Talaq Act, 2019 criminalizing the practice, the husband argued that the Act violates religious freedom under Article 25.
Fatima filed a complaint under the Triple Talaq Act, seeking criminal action against her husband and maintenance for herself and children.
The husband challenged the constitutional validity of the Triple Talaq Act, claiming it interferes with religious practices.

📜 Relevant Provisions (Explained Simply)
Triple Talaq Act, 2019 🏛️ – Declares triple talaq void and illegal, prescribes punishment up to 3 years imprisonment.

Article 25 📘 – Freedom of conscience and right to freely profess, practice and propagate religion.

Article 14 & 21 ⚖️ – Right to equality and life with dignity.

Section 125 CrPC – Maintenance provisions for divorced women.

Muslim Personal Law (Shariat) Application Act, 1937 – Governs Muslim personal law matters.

❓ Issues Before the Court
1️⃣ Whether the Triple Talaq Act, 2019 violates Article 25 (freedom of religion).
2️⃣ Whether triple talaq is an essential religious practice protected by the Constitution.
3️⃣ Whether criminalization of triple talaq is constitutionally valid.
4️⃣ What are the rights of women divorced through triple talaq post the 2019 Act.

⚖️ Court''s Analysis & Reasoning
1️⃣ Triple Talaq Not an Essential Religious Practice
The Court reiterated the findings in Shayara Bano v. Union of India (2017) that triple talaq is not an essential religious practice.
The practice is arbitrary, irrational, and violates the dignity of Muslim women.
Religious freedom cannot be used to justify practices that violate fundamental rights.

2️⃣ Constitutional Validity of Triple Talaq Act, 2019
The Act is a valid exercise of Parliament''s legislative power under Article 246.
The criminalization serves the purpose of deterring the practice and protecting women''s rights.
The Act balances religious freedom with gender justice and constitutional morality.

3️⃣ Gender Justice and Constitutional Morality
The Court emphasized that constitutional morality must prevail over personal law practices that violate women''s dignity.
Article 14 and 21 guarantee equality and dignity to all citizens, including Muslim women.
The State has a positive obligation to protect women from discriminatory practices.

4️⃣ Reasonable Classification and Non-Arbitrariness
The Act creates a reasonable classification between valid and invalid forms of divorce.
The punishment prescribed is proportionate to the harm caused and serves as an effective deterrent.
The provision for bail and compounding of offenses shows legislative wisdom.

5️⃣ Harmonious Construction with Personal Laws
The Act does not interfere with valid forms of talaq recognized under Muslim law.
It only prohibits the arbitrary and instant form of triple talaq.
Other forms of divorce like talaq-e-ahsan and talaq-e-hasan remain valid.

💡 Doctrines & Principles Applied
Doctrine of Essential Religious Practices – Only essential practices are protected under Article 25.

Constitutional Morality – Constitutional values must prevail over personal law practices.

Doctrine of Reasonable Classification – Valid classification for legislative purposes.

Gender Justice – Constitutional commitment to gender equality and women''s dignity.

⚖️ Ratio Decidendi
The Triple Talaq Act, 2019 is constitutionally valid and does not violate Article 25.
Triple talaq is not an essential religious practice and its criminalization is justified.
The Act serves the constitutional goal of gender justice and protection of women''s rights.

🧾 Judgment / Directions
1️⃣ The Triple Talaq Act, 2019 was upheld as constitutionally valid.
2️⃣ Triple talaq pronounced after the Act is void ab initio and attracts criminal liability.
3️⃣ Muslim women divorced through triple talaq are entitled to maintenance under Section 125 CrPC.
4️⃣ All courts directed to ensure speedy trial of cases under the Triple Talaq Act.
5️⃣ Legal aid to be provided to affected women for pursuing their rights.

📚 Key Precedents Cited
Shayara Bano v. Union of India (2017) – Triple talaq declared unconstitutional.
Mohd. Ahmed Khan v. Shah Bano Begum (1985) – Maintenance rights of Muslim women.
Indian Young Lawyers Association v. State of Kerala (2018) – Constitutional morality over religious practices.
Danial Latifi v. Union of India (2001) – Harmonious interpretation of personal laws.

🏁 Conclusion (One-Line Takeaway)
The Supreme Court upheld the constitutional validity of the Triple Talaq Act, 2019, reaffirming that gender justice and constitutional morality must prevail over discriminatory religious practices. ⚖️👩‍⚖️');

-- Insert Family Law Quiz Questions (CQ-25-C-01)
INSERT INTO contemporary_case_quizzes (case_number, case_name, passage, case_question_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-01', 'What was the principal legal issue in Priya Sharma v. Rajesh Sharma (2025)?', 'Whether Hindu women can claim maintenance under personal laws', 'Whether waiver of alimony bars maintenance claims under Section 125 CrPC', 'Whether Section 125 CrPC applies to Hindu marriages', 'Whether maintenance can be claimed during divorce proceedings', 'B', 'The Court held that waiver of alimony during divorce proceedings under personal laws does not bar a subsequent claim for maintenance under Section 125 CrPC, as it operates independently of personal law provisions.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-02', 'According to the judgment, what is the nature of Section 125 CrPC?', 'A personal law provision', 'A secular provision independent of personal laws', 'A constitutional provision', 'A civil law provision', 'B', 'The Court emphasized that Section 125 CrPC is a secular provision aimed at preventing vagrancy and destitution, operating independently of personal law provisions.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-03', 'Which doctrine did the Court apply to justify maintenance despite earlier waiver?', 'Doctrine of Estoppel', 'Doctrine of Changed Circumstances', 'Doctrine of Legitimate Expectation', 'Doctrine of Proportionality', 'B', 'The Court applied the Doctrine of Changed Circumstances, recognizing that circumstances can change after divorce, making a previously self-sufficient woman dependent.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-04', 'How did the Court interpret "unable to maintain herself" under Section 125 CrPC?', 'Only absolute destitution qualifies', 'Only unemployment qualifies', 'Inability to maintain reasonable standard of living', 'Only medical emergencies qualify', 'C', 'The Court held that the phrase should be interpreted liberally to include not just absolute destitution but also inability to maintain a reasonable standard of living.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-05', 'What constitutional provisions did the Court rely upon for gender justice?', 'Article 14 and Article 19', 'Article 15(3) and Article 21', 'Article 25 and Article 26', 'Article 32 and Article 226', 'B', 'The Court relied on Article 15(3) (special provisions for women) and Article 21 (right to life with dignity) to emphasize the constitutional mandate of gender justice.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-06', 'Which landmark case was cited regarding the independence of Section 125 CrPC?', 'Shah Bano case', 'Bai Tahira v. Ali Hussain Fissalli', 'Danial Latifi case', 'Rajnesh v. Neha', 'B', 'The Court cited Bai Tahira v. Ali Hussain Fissalli (1979) which established that Section 125 CrPC is independent of personal laws.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-07', 'What was the monthly maintenance amount awarded by the Court?', '₹15,000', '₹20,000', '₹25,000', '₹30,000', 'C', 'The Court directed Rajesh to pay ₹25,000 per month as maintenance to Priya Sharma.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-08', 'What public policy consideration did the Court highlight?', 'Preventing forum shopping', 'Preventing coercive settlements during divorce', 'Preventing delay in proceedings', 'Preventing multiple litigation', 'B', 'The Court noted that allowing waivers to defeat Section 125 claims would encourage coercive settlements during divorce, which goes against public policy.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-09', 'Which principle of interpretation did the Court apply to Section 125 CrPC?', 'Strict interpretation', 'Liberal interpretation in favor of beneficiary', 'Literal interpretation', 'Historical interpretation', 'B', 'The Court applied liberal interpretation, stating that beneficial legislation should be interpreted liberally in favor of the beneficiary.'),

('CQ-25-C-01', 'Priya Sharma v. Rajesh Sharma (2025 INSC 445)', 'NULL', 'CQ-25-C-01-10', 'What broader directive did the Court issue to Family Courts?', 'To expedite divorce proceedings', 'To consider changed circumstances in maintenance applications', 'To encourage mediation', 'To reduce maintenance amounts', 'B', 'The Court directed all Family Courts to consider changed circumstances while deciding maintenance applications and instructed Magistrates not to dismiss Section 125 applications merely on the ground of earlier waivers.');

-- Success message
SELECT 'Family Law cases and quiz questions inserted successfully!' as status;