-- ============================================================================
-- COGNITA YOUTH • TEEN BIBLE CHALLENGE CBT PLATFORM
-- Supabase PostgreSQL Schema & Initial Migration
-- ============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Teen Bible Challenge',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    passing_score INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 35,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    proctoring_settings JSONB NOT NULL DEFAULT '{"enableWebcam": true, "enableMic": true, "enableFullscreen": true, "maxTabSwitches": 3, "aiFaceDetection": true, "blockCopyPaste": true}'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 2. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    candidate_photo TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC NOT NULL DEFAULT 0,
    total_possible_score NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    question_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    proctor_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    integrity_score INTEGER NOT NULL DEFAULT 100,
    integrity_verdict TEXT NOT NULL DEFAULT 'clean' CHECK (integrity_verdict IN ('clean', 'flagged', 'high_risk')),
    ai_analytics JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    target_exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR FAST QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(candidate_email);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Exams: Anyone can read published exams
DROP POLICY IF EXISTS "Allow public read access to published exams" ON exams;
CREATE POLICY "Allow public read access to published exams" 
ON exams FOR SELECT 
USING (is_published = true);

-- Exams: Allow insert/update/delete for all operations (or service role)
DROP POLICY IF EXISTS "Allow public and service write to exams" ON exams;
CREATE POLICY "Allow public and service write to exams" 
ON exams FOR ALL 
USING (true) 
WITH CHECK (true);

-- Submissions: Anyone can submit an exam
DROP POLICY IF EXISTS "Allow public insert of submissions" ON submissions;
CREATE POLICY "Allow public insert of submissions" 
ON submissions FOR INSERT 
WITH CHECK (true);

-- Submissions: Anyone can read their own or public submissions
DROP POLICY IF EXISTS "Allow public read of submissions" ON submissions;
CREATE POLICY "Allow public read of submissions" 
ON submissions FOR SELECT 
USING (true);

-- Announcements: Anyone can view announcements
DROP POLICY IF EXISTS "Allow public read of announcements" ON announcements;
CREATE POLICY "Allow public read of announcements" 
ON announcements FOR SELECT 
USING (true);

-- Announcements: Anyone can insert/manage announcements
DROP POLICY IF EXISTS "Allow manage announcements" ON announcements;
CREATE POLICY "Allow manage announcements" 
ON announcements FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- INITIAL SEED DATA: 5 TEEN BIBLE CHALLENGES
-- ============================================================================
INSERT INTO exams (
  id, title, description, category, difficulty, duration_minutes, passing_score, total_marks, is_published, created_at, proctoring_settings, instructions, questions
) VALUES (
  'exam-teen-001',
  'Courage Under Fire: Daniel, Esther & Standing Firm in Babylon',
  'Explore how young believers like Daniel, Shadrach, Meshach, Abednego, and Queen Esther stood uncompromisingly for God against immense cultural pressure, fear, and peer influence.',
  'Teen Bible Challenge',
  'intermediate',
  15,
  60,
  35,
  true,
  '2026-11-06T14:38:16.836Z',
  '{"enableWebcam":true,"enableMic":true,"enableFullscreen":true,"maxTabSwitches":3,"aiFaceDetection":true,"blockCopyPaste":true}'::jsonb,
  '["Welcome to the Teen Bible Challenge!","Read each question carefully and think critically about biblical convictions and real-world teenage application.","Ask Pastor Jordan (AI Youth Mentor) if you want to explore any passage or question further.","Honor God with your honesty and integrity."]'::jsonb,
  '[{"id":"teen_q1","type":"mcq_single","text":"In Daniel 1:8, teenage Daniel \"resolved not to defile himself with the royal food and wine.\" What made Daniel''s decision so radical and counter-cultural in Babylon?","topic":"Standing Firm Against Cultural Pressure","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"He simply preferred a vegetarian lifestyle and didn''t like meat"},{"id":"opt_b","text":"He intentionally set boundaries to remain loyal to God''s covenant rather than assimilating into pagan culture"},{"id":"opt_c","text":"He was staging a political protest against Babylonian taxation"},{"id":"opt_d","text":"He wanted to challenge King Nebuchadnezzar''s chief chef to a debate"}],"correctAnswer":"opt_b","explanation":"In Daniel 1:8, Daniel and his three teenage friends drew an intentional line. In a culture designed to erase their biblical identity, they proved that young believers can maintain godly convictions without being rude, earning respect through excellence and integrity."},{"id":"teen_q2","type":"short_answer","text":"When threatened with the fiery furnace in Daniel 3:16-18, Shadrach, Meshach, and Abednego told the king: \"Our God is able to deliver us... but even if He does not, we will not serve your gods.\" How does this \"even if\" faith apply to Christian teenagers facing modern peer pressure, social rejection, or cancel culture?","topic":"Unconditional Faith & Peer Pressure","bloomLevel":"application","marks":10,"correctAnswer":"It demonstrates an \"even if\" faith that obeys God because He is worthy, regardless of whether it results in popularity, acceptance, or suffering. Teens apply this by doing what is right even if friends mock them, exclude them, or misunderstand their convictions.","evaluationRubric":"Award full marks (8-10) if the student articulates: 1) The meaning of \"even if\" faith (obedience without guarantee of easy outcomes/deliverance), and 2) A clear, personal application to teenage life (e.g. resisting peer pressure, standing alone at school, enduring social exclusion).","explanation":"Shadrach, Meshach, and Abednego didn''t base their loyalty to God on whether things worked out smoothly. They loved God unconditionally. For Christian teens today, \"even if\" faith means choosing purity and truth even when everyone else is following the crowd."},{"id":"teen_q3","type":"mcq_multiple","text":"In Esther 4:13-16, when Mordecai challenged young Queen Esther with \"who knows but that you have come to your royal position for such a time as this?\", how did Esther respond? (Select all that apply)","topic":"Courage, Calling & Sacred Risk","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"She mobilized collective prayer and fasting among the people for three days"},{"id":"opt_b","text":"She surrendered self-preservation with the famous declaration: \"If I perish, I perish\""},{"id":"opt_c","text":"She bravely approached the king uninvited, risking execution under Persian law"},{"id":"opt_d","text":"She fled the palace and disguised herself as a traveler to escape responsibility"}],"correctAnswer":["opt_a","opt_b","opt_c"],"explanation":"Esther recognized that God places us in specific positions not for self-indulgence, but for divine purpose. She united spiritual discipline (fasting and prayer) with radical holy courage (Esther 4:16)."},{"id":"teen_q4","type":"true_false","text":"True or False: According to 1 Corinthians 10:13, God promises that teenagers will never face temptation, because real Christians are completely immune to worldly desires.","topic":"Overcoming Temptation","bloomLevel":"knowledge","marks":5,"options":[{"id":"opt_true","text":"True"},{"id":"opt_false","text":"False"}],"correctAnswer":"opt_false","explanation":"False! 1 Corinthians 10:13 states that temptation is common to everyone, including teens. However, God is faithful: He will not let you be tempted beyond what you can bear, and will always provide a way out so you can endure it."},{"id":"teen_q5","type":"short_answer","text":"When Joseph was repeatedly pressured by Potiphar’s wife in Genesis 39:9, he broke away and ran out of the house, stating: \"How then could I do such a wicked thing and sin against God?\" What does Joseph’s reaction teach teenagers about guarding moral purity and handling dangerous situations?","topic":"Joseph: Guarding Purity & Integrity","bloomLevel":"application","marks":10,"correctAnswer":"Joseph recognized that sin is first and foremost against God. He did not negotiate or stay in a compromising environment—he took decisive physical action by running away. Teens learn that the smartest way to handle sexual temptation or compromised situations is to run and set clear boundaries beforehand.","evaluationRubric":"Give full credit if the student mentions: 1) Recognizing accountability to God, and 2) Taking decisive, proactive action to remove oneself from compromising situations/environments.","explanation":"Joseph didn''t debate or try to test his willpower—he fled! In high school and teenage relationships, fleeing temptation and establishing boundaries before pressure hits is the biblical blueprint for integrity (2 Timothy 2:22)."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  passing_score = EXCLUDED.passing_score,
  total_marks = EXCLUDED.total_marks,
  proctoring_settings = EXCLUDED.proctoring_settings,
  instructions = EXCLUDED.instructions,
  questions = EXCLUDED.questions;

INSERT INTO exams (
  id, title, description, category, difficulty, duration_minutes, passing_score, total_marks, is_published, created_at, proctoring_settings, instructions, questions
) VALUES (
  'exam-teen-002',
  'Identity, Purpose & Self-Worth: Who God Says You Are',
  'In a culture obsessed with likes, filters, and social media comparison, discover what Scripture reveals about your true identity, unconditional value, and God-given destiny.',
  'Teen Bible Challenge',
  'intermediate',
  15,
  60,
  35,
  true,
  '2026-11-06T14:38:16.836Z',
  '{"enableWebcam":true,"enableMic":true,"enableFullscreen":true,"maxTabSwitches":3,"aiFaceDetection":true,"blockCopyPaste":true}'::jsonb,
  '["Welcome to the Teen Identity & Purpose Challenge!","Reflect on how God sees you versus how social media measures worth.","Answer openly and connect scripture to real feelings of comparison and anxiety."]'::jsonb,
  '[{"id":"id_q1","type":"mcq_single","text":"In Ephesians 2:10, the apostle Paul writes that believers are \"God’s handiwork (workmanship), created in Christ Jesus to do good works.\" The Greek word used here for handiwork is \"poiēma\". What does this imply about your worth?","topic":"God’s Masterpiece","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"You were mass-produced without any special consideration"},{"id":"opt_b","text":"You are God’s poem, artwork, or masterpiece, intentionally crafted with unique gifts and purpose"},{"id":"opt_c","text":"Your value depends entirely on how many achievements you rack up on your resume"},{"id":"opt_d","text":"God only loves you when you perform without making any mistakes"}],"correctAnswer":"opt_b","explanation":"The word \"poiēma\" (root of poem) means a work of art or master craftsmanship. Ephesians 2:10 reminds teens that you aren''t a cosmic accident or a copy; you are God''s intentional masterpiece created with unique purpose."},{"id":"id_q2","type":"short_answer","text":"Psalm 139:13-14 states: \"For you created my inmost being; you knit me together in my mother''s womb. I praise you because I am fearfully and wonderfully made.\" How does this truth help a teenager combat insecurities fueled by social media comparison and beauty standards?","topic":"Self-Worth vs Social Media Comparison","bloomLevel":"application","marks":10,"correctAnswer":"It anchors identity in the Creator rather than culture. When teens realize they were intricately woven by God on purpose, their self-worth no longer hinges on follower counts, likes, or airbrushed beauty standards. They can celebrate who God made them to be without tearing others down.","evaluationRubric":"Full credit (8-10 marks) for identifying: 1) God as the intentional Designer of our bodies and personality, and 2) A direct antidote to comparison, filters, or anxiety about fitting in.","explanation":"Social media algorithms thrive on making teens feel incomplete so they buy into trends. Psalm 139 breaks this trap by anchoring your value in God’s intentional design before you took your first breath."},{"id":"id_q3","type":"mcq_single","text":"In Romans 12:2, Paul gives crucial instructions for living in a secular world: \"Do not conform to the pattern of this world, but be transformed by the renewing of your mind.\" What does it mean for a teen to \"renew their mind\"?","topic":"Renewing the Mind","bloomLevel":"application","marks":5,"options":[{"id":"opt_a","text":"Filtering your thoughts through Scripture and the Holy Spirit rather than adopting toxic cultural narratives"},{"id":"opt_b","text":"Deleting all social media apps forever and refusing to talk to anyone"},{"id":"opt_c","text":"Memorizing the dictionary to appear smarter than other classmates"},{"id":"opt_d","text":"Ignoring real-world problems and pretending life is always perfect"}],"correctAnswer":"opt_a","explanation":"The Greek word \"suschematizo\" means being poured into the mold of the world. Mind renewal happens when teens intentionally align their thoughts, values, and music/media diet with God’s unchanging truth (Philippians 4:8)."},{"id":"id_q4","type":"true_false","text":"True or False: Philippians 4:6-7 teaches that feeling anxious is an unforgivable sin, and Christians should hide their mental health struggles in shame.","topic":"Anxiety, Prayer & Mental Health","bloomLevel":"knowledge","marks":5,"options":[{"id":"opt_true","text":"True"},{"id":"opt_false","text":"False"}],"correctAnswer":"opt_false","explanation":"False! The Bible is deeply honest about human struggles (even Jesus felt deep sorrow in Gethsemane). Philippians 4:6-7 invites teens to bring every anxious thought into God''s presence through prayer, promising that His supernatural peace will guard your heart and mind."},{"id":"id_q5","type":"short_answer","text":"In 1 John 3:1, John writes: \"See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!\" Why is being a \"child of God\" a more secure identity than being defined by sports, grades, popularity, or relationship status?","topic":"The Permanence of Divine Adoption","bloomLevel":"application","marks":10,"correctAnswer":"Because accomplishments, grades, and popularity are temporary and can be lost through injury, failure, or shifting trends. Being a child of God is based on God''s unchanging love and Christ''s sacrifice, meaning your core identity can never be canceled, taken away, or demoted.","evaluationRubric":"Award full marks if the student contrasts temporary, performance-based identity with the eternal, unconditional security of being adopted into God''s family.","explanation":"If your identity is based on your GPA, sports performance, or popularity, a single bad week can shatter your self-worth. But when your foundation is as a redeemed son or daughter of God, your value remains unbreakable."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  passing_score = EXCLUDED.passing_score,
  total_marks = EXCLUDED.total_marks,
  proctoring_settings = EXCLUDED.proctoring_settings,
  instructions = EXCLUDED.instructions,
  questions = EXCLUDED.questions;

INSERT INTO exams (
  id, title, description, category, difficulty, duration_minutes, passing_score, total_marks, is_published, created_at, proctoring_settings, instructions, questions
) VALUES (
  'exam-teen-003',
  'Radical Kingdom Living: The Sermon on the Mount',
  'Explore Jesus’ revolutionary manifesto in Matthew 5-7 on true greatness, authentic integrity, loving your enemies, handling anger, and overcoming the anxiety of life.',
  'Teen Bible Challenge',
  'intermediate',
  15,
  60,
  35,
  true,
  '2026-11-06T14:38:16.836Z',
  '{"enableWebcam":true,"enableMic":true,"enableFullscreen":true,"maxTabSwitches":3,"aiFaceDetection":true,"blockCopyPaste":true}'::jsonb,
  '["Welcome to the Sermon on the Mount Challenge!","Jesus calls His followers to an authentic, counter-cultural way of living.","Reflect on how Kingdom ethics apply to your school, friendships, and digital world."]'::jsonb,
  '[{"id":"sm_q1","type":"mcq_single","text":"In Matthew 5:13-16, Jesus calls His followers \"the salt of the earth\" and \"the light of the world.\" In the ancient world, salt was a vital preservative against decay. What does this mean for Christian teens in high school?","topic":"Salt and Light in High School","bloomLevel":"application","marks":5,"options":[{"id":"opt_a","text":"Teens should throw salt at classmates who tell lies"},{"id":"opt_b","text":"Teens are called to preserve moral truth, bring spiritual flavor, and stand as visible beacons of love in a dark culture"},{"id":"opt_c","text":"Teens must only hang out with other Christians and avoid everyone else"},{"id":"opt_d","text":"Salt symbolizes that Christians should be bitter toward secular people"}],"correctAnswer":"opt_b","explanation":"Salt prevents rot and adds flavor; light pushes back darkness. Jesus calls teens to transform their school hallways, team locker rooms, and group chats through genuine kindness, integrity, and speaking up for the hurting."},{"id":"sm_q2","type":"short_answer","text":"In Matthew 5:43-44, Jesus delivers one of His most shocking commands: \"You have heard that it was said, ''Love your neighbor and hate your enemy.'' But I tell you, love your enemies and pray for those who persecute you.\" How can a teenager realistically practice this when dealing with rumors, cyberbullying, or betrayal by a close friend?","topic":"Loving Enemies & Overcoming Retaliation","bloomLevel":"application","marks":10,"correctAnswer":"Instead of clapping back, gossiping, or seeking revenge on social media, teens practice this by refusing to retaliate, setting healthy boundaries, praying for the person''s healing and heart change, and choosing forgiveness over bitterness.","evaluationRubric":"Give full credit if the student provides practical examples: 1) Refusing revenge / trash talk / online retaliation, and 2) Actively praying for the offender and setting godly boundaries.","explanation":"Loving enemies doesn''t mean being a doormat or letting people abuse you. It means breaking the cycle of retaliation: responding with blessing, maintaining boundaries, and asking God to touch their heart."},{"id":"sm_q3","type":"mcq_multiple","text":"In Matthew 6:1-6, what does Jesus warn against regarding \"performative righteousness\" (doing good deeds in public)? (Select all that apply)","topic":"Authentic Integrity vs Social Posturing","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"Doing spiritual things merely to be seen and praised by people earns no reward from God"},{"id":"opt_b","text":"True prayer and giving should be done in secret before your Heavenly Father"},{"id":"opt_c","text":"Hypocrites already have their reward in full (fleeting human applause)"},{"id":"opt_d","text":"It is a sin to ever pray aloud with friends in a youth group"}],"correctAnswer":["opt_a","opt_b","opt_c"],"explanation":"Jesus exposed virtue signaling 2,000 years before social media! God examines our internal motives: are we living for human validation and clout, or for our Heavenly Father’s quiet approval?"},{"id":"sm_q4","type":"true_false","text":"True or False: In Matthew 7:1-5, when Jesus says \"Do not judge, or you too will be judged,\" He means that Christians must never discern between right and wrong, and should accept any behavior without biblical conviction.","topic":"Judging vs Hypocrisy","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_true","text":"True"},{"id":"opt_false","text":"False"}],"correctAnswer":"opt_false","explanation":"False! Jesus immediately follows with the parable of the speck and the plank: examine your own heart first so you can clearly help your brother. Jesus condemns self-righteous hypocrisy, not biblical discernment or loving accountability."},{"id":"sm_q5","type":"short_answer","text":"In Matthew 6:25-34, Jesus addresses the anxiety of everyday life (food, clothing, future) and points to the birds of the air and lilies of the field. What is Jesus’ core promise in Matthew 6:33, and how does it help a teenager stressed about college, grades, and future careers?","topic":"Seeking First the Kingdom: Matthew 6:33","bloomLevel":"application","marks":10,"correctAnswer":"Jesus promises: \"Seek first the kingdom of God and His righteousness, and all these things will be given to you as well.\" For teens worried about the future, it reframes priorities: when you put God at the center of your ambitions, He faithfully provides what you need and guides your steps.","evaluationRubric":"Award full marks for identifying: 1) Matthew 6:33 core principle (God first, His righteousness), and 2) Application to teenage future anxiety (trusting God with college, direction, and provision).","explanation":"Stress about future college admissions or career paths can consume high schoolers. Jesus reminds us that our Heavenly Father knows what we need before we ask. Put His Kingdom first, and the pieces of your future will fall into place."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  passing_score = EXCLUDED.passing_score,
  total_marks = EXCLUDED.total_marks,
  proctoring_settings = EXCLUDED.proctoring_settings,
  instructions = EXCLUDED.instructions,
  questions = EXCLUDED.questions;

INSERT INTO exams (
  id, title, description, category, difficulty, duration_minutes, passing_score, total_marks, is_published, created_at, proctoring_settings, instructions, questions
) VALUES (
  'exam-teen-004',
  'Faith in Culture: Paul, Timothy & Next-Gen Leadership',
  'Learn from the mentorship between Paul and young Timothy on how teenagers can set the pace for faith, purity, sound doctrine, and leadership in their generation.',
  'Teen Bible Challenge',
  'advanced',
  15,
  60,
  35,
  true,
  '2026-11-06T14:38:16.836Z',
  '{"enableWebcam":true,"enableMic":true,"enableFullscreen":true,"maxTabSwitches":3,"aiFaceDetection":true,"blockCopyPaste":true}'::jsonb,
  '["Welcome to the Next-Gen Leadership Challenge!","Discover how young believers shaped the early church and how you can lead today.","Test your understanding of spiritual warfare, discipleship, and cultural engagement."]'::jsonb,
  '[{"id":"lead_q1","type":"mcq_single","text":"In 1 Timothy 4:12, Paul writes: \"Don’t let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.\" What five areas of teenage leadership are highlighted here?","topic":"Young Leadership Blueprint","bloomLevel":"knowledge","marks":5,"options":[{"id":"opt_a","text":"Social media clout, athletic skill, wealth, fashion, and popularity"},{"id":"opt_b","text":"Speech, conduct (lifestyle), love, faith, and purity"},{"id":"opt_c","text":"Grade point average, attendance, debate skills, silence, and obedience"},{"id":"opt_d","text":"Age, theological degree, title, authority, and eloquence"}],"correctAnswer":"opt_b","explanation":"Paul makes it clear that leadership isn''t about age or titles; it''s about character. Teens lead their peers and churches by how they talk, how they live, how they love, how they trust God, and how they guard their moral purity."},{"id":"lead_q2","type":"short_answer","text":"In 2 Timothy 1:7, Paul encourages Timothy during a season of intimidation and fear: \"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline (a sound mind).\" How does this verse empower teenagers dealing with fear of failure, social anxiety, or intimidation when speaking about Jesus?","topic":"Overcoming Fear & Timidity","bloomLevel":"application","marks":10,"correctAnswer":"It reminds teens that crippling fear and timidity do not originate from God. Instead, the Holy Spirit equips them with divine power to act boldly, authentic love to care for others over self-consciousness, and a sound mind/self-discipline to overcome panic and anxiety.","evaluationRubric":"Give full credit if the student breaks down: 1) Fear/timidity is not from God, and 2) The threefold gift of the Spirit: power, love, and a sound mind/self-discipline applied to teen anxieties.","explanation":"When fear tells you to stay quiet or hide your faith, remember that the Holy Spirit within you is greater than any cultural intimidation. God replaces panic with power, love, and mental clarity."},{"id":"lead_q3","type":"mcq_multiple","text":"In Ephesians 6:10-18, the \"Armor of God\" is described for spiritual warfare. Which of the following pieces and functions are biblically accurate? (Select all that apply)","topic":"The Armor of God in Daily Life","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"The Belt of Truth: anchoring your life in God''s objective reality against cultural deceit"},{"id":"opt_b","text":"The Shield of Faith: extinguishing the flaming arrows of doubt, shame, and temptation"},{"id":"opt_c","text":"The Helmet of Salvation: protecting your thoughts and mindset with the assurance of Christ''s victory"},{"id":"opt_d","text":"The Sword of the Spirit: God''s written Word, our active offensive weapon"}],"correctAnswer":["opt_a","opt_b","opt_c","opt_d"],"explanation":"All four pieces are essential parts of spiritual defense and offense! Roman soldiers needed every part of armor to stand firm against enemy assault. In the same way, Christian teens rely on truth, faith, salvation, and the Word of God daily."},{"id":"lead_q4","type":"true_false","text":"True or False: In Acts 17:16-34, when Paul visited Athens, he angrily screamed at the secular philosophers and insulted their culture, proving that Christian engagement always requires mocking non-believers.","topic":"Paul in Athens: Cultural Engagement","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_true","text":"True"},{"id":"opt_false","text":"False"}],"correctAnswer":"opt_false","explanation":"False! In Acts 17, Paul respectfully observed their altar to the \"Unknown God\", quoted their own Greek poets, and found common ground to gently point them toward the resurrected Jesus Christ. He modeled thoughtful, respectful engagement with secular culture."},{"id":"lead_q5","type":"short_answer","text":"In 2 Timothy 2:22, Paul gives young Timothy a two-part instruction: \"Flee the evil desires of youth and pursue righteousness, faith, love and peace, along with those who call on the Lord out of a pure heart.\" Why is having a community of godly Christian friends (\"those who call on the Lord\") critical for surviving high school with your faith intact?","topic":"Godly Friendships & Accountability","bloomLevel":"application","marks":10,"correctAnswer":"Because 1 Corinthians 15:33 warns that \"bad company corrupts good character.\" Having authentic Christian friends provides accountability, mutual prayer, encouragement during hard times, and a safe community where you can grow together without compromising your convictions.","evaluationRubric":"Award full marks (8-10) if the student explains: 1) The danger of isolation / negative peer pressure, and 2) The strength, accountability, and endurance that comes from a godly inner circle.","explanation":"No Christian is meant to be a lone wolf. The friends you surround yourself with in high school shape your trajectory. Pursuing faith alongside friends who love Jesus makes standing strong joyful and sustainable."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  passing_score = EXCLUDED.passing_score,
  total_marks = EXCLUDED.total_marks,
  proctoring_settings = EXCLUDED.proctoring_settings,
  instructions = EXCLUDED.instructions,
  questions = EXCLUDED.questions;

INSERT INTO exams (
  id, title, description, category, difficulty, duration_minutes, passing_score, total_marks, is_published, created_at, proctoring_settings, instructions, questions
) VALUES (
  'exam-teen-005',
  'Tough Questions & Apologetics: The Reason for Hope',
  'Equip your mind to answer tough questions from skeptics and peers: Why trust the Bible? Did Jesus really rise? What about suffering? How can Jesus be the only way?',
  'Teen Bible Challenge',
  'advanced',
  15,
  60,
  35,
  true,
  '2026-11-06T14:38:16.836Z',
  '{"enableWebcam":true,"enableMic":true,"enableFullscreen":true,"maxTabSwitches":3,"aiFaceDetection":true,"blockCopyPaste":true}'::jsonb,
  '["Welcome to the Teen Apologetics Challenge!","Faith is not blind; it is reasoned trust grounded in historical truth.","Learn how to articulate what you believe with gentleness and respect."]'::jsonb,
  '[{"id":"ap_q1","type":"mcq_single","text":"In 1 Peter 3:15, what does Peter instruct every believer to always be prepared to do, and with what specific attitude?","topic":"The Core of Christian Apologetics","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"Argue loudly and humiliate anyone who disagrees with you online"},{"id":"opt_b","text":"Give an answer (defense) for the reason for your hope, but do this with gentleness and respect"},{"id":"opt_c","text":"Avoid talking to anyone who isn''t already a Christian"},{"id":"opt_d","text":"Accept that all religions teach the exact same thing without differences"}],"correctAnswer":"opt_b","explanation":"1 Peter 3:15 is the foundation of biblical apologetics (\"apologia\" = reasoned defense). Peter pairs intellectual readiness with Christlike posture: always with gentleness and respect, never arrogance or hostility."},{"id":"ap_q2","type":"short_answer","text":"In 1 Corinthians 15:14-19, the apostle Paul makes a bold claim: \"If Christ has not been raised, our preaching is useless and so is your faith.\" Why is the historical bodily resurrection of Jesus the bedrock of Christianity, and what historical evidence supports it?","topic":"The Historical Resurrection of Jesus","bloomLevel":"application","marks":10,"correctAnswer":"Unlike philosophies based merely on ideas, Christianity stands or falls on the historical event of Jesus'' resurrection. Key evidence includes: the empty tomb, the eyewitness testimonies of hundreds of people (1 Cor 15:6), the radical transformation of skeptical disciples like James and persecutor Paul who died for their testimony, and the sudden emergence of the Church in Jerusalem.","evaluationRubric":"Give full marks (8-10) for articulating: 1) Why Christianity depends on the historical fact of the resurrection, and 2) Citing at least two pieces of historical evidence (e.g. empty tomb, post-crucifixion appearances, disciples'' willingness to die for the claim, transformation of Paul/James).","explanation":"Christianity is not a fairy tale or moral wish; it is anchored in history. The disciples didn''t die for a message they knew was a hoax; they witnessed the risen Jesus face-to-face and turned the world upside down."},{"id":"ap_q3","type":"mcq_multiple","text":"When Thomas struggled with honest doubt in John 20:24-29 after the crucifixion, how did Jesus respond to him? (Select all that apply)","topic":"Handling Honest Doubt","bloomLevel":"comprehension","marks":5,"options":[{"id":"opt_a","text":"Jesus met Thomas directly and invited him to touch His hands and His side"},{"id":"opt_b","text":"Jesus showed patience and provided real evidence rather than canceling Thomas"},{"id":"opt_c","text":"Jesus cursed Thomas and cast him out of the apostles forever"},{"id":"opt_d","text":"Thomas responded in worship: \"My Lord and my God!\""}],"correctAnswer":["opt_a","opt_b","opt_d"],"explanation":"Jesus doesn''t reject honest doubts; He invites honest seekers into truth! He met Thomas in his questions and gave him the evidence he needed, leading Thomas to declare Jesus as Lord and God."},{"id":"ap_q4","type":"true_false","text":"True or False: In John 14:6, Jesus claimed to be one of many equally valid paths up the spiritual mountain, stating that truth is whatever feels right to each individual.","topic":"Truth vs Relativism","bloomLevel":"knowledge","marks":5,"options":[{"id":"opt_true","text":"True"},{"id":"opt_false","text":"False"}],"correctAnswer":"opt_false","explanation":"False! Jesus made an exclusive, radical claim: \"I am the way and the truth and the life. No one comes to the Father except through me.\" Jesus didn''t claim to point to truth; He claimed to be Truth incarnate."},{"id":"ap_q5","type":"short_answer","text":"A common question from high school friends is: \"If God is good and loving, why is there so much suffering, bullying, and pain in the world?\" How does the Christian worldview answer this question, and how does the Cross of Jesus offer unique comfort?","topic":"The Problem of Evil & The Cross","bloomLevel":"application","marks":10,"correctAnswer":"The Bible teaches that evil entered the world through human rebellion and brokenness (free will). God didn''t stay distant from our suffering: on the Cross, Jesus stepped directly into human agony and bore our pain. Furthermore, God promises that in Christ, suffering is temporary, and He will wipe away every tear and make all things new (Revelation 21:4).","evaluationRubric":"Award full marks if the student addresses: 1) The origin of evil through human sin/broken world, and 2) The unique Christian comfort that God suffered with us on the Cross and will ultimately destroy evil forever.","explanation":"In other worldviews, suffering is an illusion or cold karma. In Christianity, God loved us so much that He took on human flesh and suffered alongside us on the Cross. He understands your deepest pain, and promises that pain will not have the final word."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  passing_score = EXCLUDED.passing_score,
  total_marks = EXCLUDED.total_marks,
  proctoring_settings = EXCLUDED.proctoring_settings,
  instructions = EXCLUDED.instructions,
  questions = EXCLUDED.questions;
