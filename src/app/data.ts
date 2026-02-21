// ====================================================================
// TEACHER COPILOT — HARDCODED CONTEXT DATA
// ====================================================================
// This file contains ALL the context the AI agent needs:
//   1. Teacher profiles (personal constraints, qualifications, style)
//   2. Student personas (strengths, weaknesses, learning styles)
//   3. Curriculum data
//   4. Scheduling constraints
// ====================================================================

// --- 1. INTERFACES ---
export interface SubjectTopic {
  name: string;
  subtopics: string[];
  practical: string;
}

export interface Student {
  id: string;
  name: string;
  rollNo: number;
  category: "High Performer" | "Average" | "Struggler";
  strength: string;
  weakness: string;
  attendance: string;
  learningStyle: "Visual" | "Auditory" | "Kinesthetic" | "Reading";
  notes: string;
  scores: { Math: number; Physics: number; Biology: number };
}

export interface ScheduleConstraint {
  unavailableDays: string[];          // e.g., ["Saturday"] for PhD work
  unavailableSlots: string[];         // e.g., ["Monday 10:00-12:00"]
  maxHoursPerDay: number;
  preferredTimeSlots: string[];       // e.g., ["Morning 9:00-12:00"]
  recurringCommitments: string[];     // e.g., ["PhD seminar every Friday 2PM-5PM"]
  notes: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  age: number;
  qualification: string;
  experience: string;
  english_fluency: "Poor" | "Average" | "Good";
  teaching_style: string;
  strength: string;
  weakness: string;
  personalContext: string;            // Rich personal context for AI
  techComfort: "Low" | "Medium" | "High";
  scheduleConstraints: ScheduleConstraint;
  subjects: string[];
  classes: string[];
}

export interface ClassData {
  className: string;
  teacherId: string;
  students: Student[];
  curriculum: { [key: string]: SubjectTopic[] };
  totalPeriods: number;               // periods per week
  periodDurationMinutes: number;
}

// --- 2. TEACHER DATABASE (ENRICHED) ---
export const TEACHERS: { [key: string]: TeacherProfile } = {
  "Sunita": {
    id: "t1",
    name: "Sunita Sharma",
    age: 45,
    qualification: "M.A. Hindi, B.Ed, PhD (in progress)",
    experience: "15 Years",
    english_fluency: "Poor",
    teaching_style: "Textbook Reader — reads from NCERT, explains in Hindi",
    strength: "Caring, motherly figure. Students feel comfortable. Deep knowledge of Hindi literature. Very patient with slow learners.",
    weakness: "Struggles to explain logic and STEM concepts. Relies on rote memorization. Not comfortable with English medium.",
    personalContext: `Sunita Sharma mam is currently pursuing her PhD degree in Hindi Literature from the state university. She has PhD research work (thesis writing, supervisor meetings, library work) apart from regular school classes. Her PhD supervisor meetings are typically on Wednesdays and Fridays after 2 PM. She spends weekends on her research papers and thesis chapters. She gets tired easily due to the dual workload of teaching and PhD. She prefers shorter, well-structured lesson plans that she can execute without too much improvisation. She needs explanations in simple Hindi or Hinglish. Technology makes her nervous — she prefers printed handouts over digital tools. She is a vegetarian and often uses food analogies in teaching.`,
    techComfort: "Low",
    scheduleConstraints: {
      unavailableDays: [],
      unavailableSlots: [
        "Wednesday 14:00-17:00",   // PhD supervisor meeting
        "Friday 14:00-17:00",      // PhD seminar / library work
      ],
      maxHoursPerDay: 5,
      preferredTimeSlots: ["Morning 8:00-13:00"],
      recurringCommitments: [
        "PhD supervisor meeting every Wednesday 2PM-5PM",
        "PhD seminar every Friday 2PM-5PM",
        "Weekend thesis writing (Saturday & Sunday)",
      ],
      notes: "Avoid scheduling anything after 2PM on Wed/Fri. She needs buffer time for PhD work. Prefers morning classes. Gets overwhelmed if more than 3 back-to-back classes."
    },
    subjects: ["Hindi", "Math"],
    classes: ["Class 6A", "Class 7B"],
  },

  "Rajesh": {
    id: "t2",
    name: "Rajesh Yadav",
    age: 58,
    qualification: "B.Sc Physics",
    experience: "30 Years",
    english_fluency: "Average",
    teaching_style: "Old-school chalk-and-talk. Uses traditional methods.",
    strength: "Deep understanding of Physics fundamentals. Can explain complex concepts using everyday examples. Students respect him.",
    weakness: "Not aware of much of the new technology. Cannot use computers or projectors properly. Handwriting on board is sometimes unclear. Gets confused with modern curriculum changes.",
    personalContext: `Rajesh Yadav sir is 58 years old and nearing retirement. He is not aware of much of the new tech — he doesn't use smartphones effectively, cannot operate projectors or smartboards, and prefers chalk-and-talk. He has a chronic knee problem and has doctor appointments every few weeks (typically every 2-3 weeks on Tuesdays). He sometimes needs to leave early for medical checkups. He walks slowly due to knee pain and prefers ground floor classrooms. He is a very experienced teacher but feels left behind by the new NEP changes. He needs very simple, step-by-step instructions. Any technology-based tasks should be extremely simplified for him or delegated. He is a very good storyteller and uses real-life examples from his 30 years of teaching.`,
    techComfort: "Low",
    scheduleConstraints: {
      unavailableDays: [],
      unavailableSlots: [
        "Tuesday 11:00-14:00",   // Doctor appointment (every 2-3 weeks, but blocked)
      ],
      maxHoursPerDay: 4,               // Lower stamina due to age/health
      preferredTimeSlots: ["Morning 9:00-13:00"],
      recurringCommitments: [
        "Doctor appointment every 2-3 weeks on Tuesday (usually 11AM-2PM)",
        "Physiotherapy on alternate Saturdays",
      ],
      notes: "Has knee problems, needs ground floor classrooms. Cannot stand for more than 40 minutes at a stretch. Avoid scheduling heavy practical labs for him. Max 4 periods per day. Doctor appointments may require flexible scheduling on Tuesdays."
    },
    subjects: ["Physics"],
    classes: ["Class 6B"],
  },

  "Anjali": {
    id: "t3",
    name: "Anjali Deshmukh",
    age: 22,
    qualification: "B.Sc Math (Final Year, in progress)",
    experience: "6 Months (Intern/Trainee)",
    english_fluency: "Good",
    teaching_style: "Enthusiastic but inexperienced. Tries modern methods but execution is weak.",
    strength: "Tech-savvy, comfortable with digital tools, projectors, and online resources. Energetic and young — students relate to her. Willing to learn and experiment.",
    weakness: "Very less experience in teaching and explaining concepts. She is doing her final year undergraduate course (B.Sc Math) and has those college classes apart from school teaching. Sometimes gets flustered when students ask difficult questions. Classroom management is weak — students don't take her seriously because she's young. Needs mentorship and structured guidance.",
    personalContext: `Anjali Deshmukh is a new, young teacher who is still doing her final year B.Sc Mathematics degree. She has her own undergraduate college classes on Monday/Wednesday/Friday mornings (8AM-11AM) at the state university. She joins school only after 11:30 AM on those days. On Tuesday and Thursday, she is available full day. She has college exams in March and September — during exam prep weeks she needs lighter teaching loads. She is very good with technology — can use Google Workspace, make presentations, use interactive tools. She lacks confidence in explaining to older/harder students. She is best suited for lower classes and needs detailed lesson plans with exact scripts because she doesn't have enough experience to improvise. Her college semester exams are approaching and she needs to balance both.`,
    techComfort: "High",
    scheduleConstraints: {
      unavailableDays: [],
      unavailableSlots: [
        "Monday 08:00-11:30",     // College classes
        "Wednesday 08:00-11:30",  // College classes
        "Friday 08:00-11:30",     // College classes
      ],
      maxHoursPerDay: 4,               // Part-time due to college
      preferredTimeSlots: [
        "Monday 12:00-16:00",
        "Tuesday 08:00-16:00",
        "Wednesday 12:00-16:00",
        "Thursday 08:00-16:00",
        "Friday 12:00-16:00"
      ],
      recurringCommitments: [
        "B.Sc college classes Mon/Wed/Fri 8AM-11AM",
        "College semester exams in March and September",
        "College practicals on alternate Saturdays",
      ],
      notes: "Available only after 11:30AM on Mon/Wed/Fri. Full day available on Tue/Thu. Reduce workload during exam season (2 weeks before March and September). She is still learning to teach — provide detailed scripts and step-by-step plans."
    },
    subjects: ["Math"],
    classes: ["Class 7A"],
  }
};

// *** EXPORT DEFAULT PROFILE ***
export const TEACHER_PROFILE = TEACHERS["Sunita"];

// --- 3. DETAILED STUDENT PERSONAS ---
// Pre-configured students with real personalities for AI context

const STUDENT_PERSONAS: Student[] = [
  // --- HIGH PERFORMERS ---
  { id: "s1", name: "Aarav Sharma", rollNo: 1, category: "High Performer", strength: "Excellent at mental math, always finishes first", weakness: "Gets bored when pace is slow, sometimes disruptive", attendance: "95%", learningStyle: "Visual", notes: "Olympiad participant, needs challenging problems", scores: { Math: 92, Physics: 88, Biology: 85 } },
  { id: "s2", name: "Priya Patel", rollNo: 2, category: "High Performer", strength: "Very organized, neat notes, helps others", weakness: "Perfectionist, takes too long on tests", attendance: "98%", learningStyle: "Reading", notes: "Class monitor, responsible", scores: { Math: 90, Physics: 91, Biology: 94 } },
  { id: "s3", name: "Vivaan Gupta", rollNo: 3, category: "High Performer", strength: "Strong logical reasoning, good at puzzles", weakness: "Poor handwriting, messy work", attendance: "92%", learningStyle: "Kinesthetic", notes: "Interested in robotics", scores: { Math: 95, Physics: 90, Biology: 78 } },
  { id: "s4", name: "Ananya Singh", rollNo: 4, category: "High Performer", strength: "Bilingual, explains well in both Hindi and English", weakness: "Sometimes overconfident", attendance: "96%", learningStyle: "Auditory", notes: "Good at presentations", scores: { Math: 88, Physics: 85, Biology: 92 } },

  // --- AVERAGE STUDENTS ---
  { id: "s5", name: "Rohan Verma", rollNo: 5, category: "Average", strength: "Hardworking, always completes homework", weakness: "Slow to grasp new concepts", attendance: "88%", learningStyle: "Visual", notes: "Needs repeated explanations", scores: { Math: 65, Physics: 60, Biology: 70 } },
  { id: "s6", name: "Ishika Malhotra", rollNo: 6, category: "Average", strength: "Good at Biology, loves nature", weakness: "Struggles with Math calculations", attendance: "85%", learningStyle: "Kinesthetic", notes: "Enjoys practical activities", scores: { Math: 55, Physics: 62, Biology: 80 } },
  { id: "s7", name: "Krishna Yadav", rollNo: 7, category: "Average", strength: "Obedient, follows instructions well", weakness: "Lacks confidence to ask doubts", attendance: "90%", learningStyle: "Auditory", notes: "Shy, needs encouragement", scores: { Math: 60, Physics: 58, Biology: 65 } },
  { id: "s8", name: "Meera Reddy", rollNo: 8, category: "Average", strength: "Creative, good at diagrams", weakness: "Poor at memorization", attendance: "82%", learningStyle: "Visual", notes: "Artistic, loves drawing", scores: { Math: 58, Physics: 65, Biology: 72 } },
  { id: "s9", name: "Sai Kulkarni", rollNo: 9, category: "Average", strength: "Consistent performance", weakness: "Does minimum effort, no initiative", attendance: "87%", learningStyle: "Reading", notes: "Quiet, stays under radar", scores: { Math: 62, Physics: 60, Biology: 68 } },
  { id: "s10", name: "Nisha Tiwari", rollNo: 10, category: "Average", strength: "Good memory, remembers facts", weakness: "Cannot apply concepts to new problems", attendance: "84%", learningStyle: "Auditory", notes: "Rote learner, needs conceptual push", scores: { Math: 64, Physics: 56, Biology: 75 } },

  // --- STRUGGLERS ---
  { id: "s11", name: "Ravi Ahuja", rollNo: 11, category: "Struggler", strength: "Good at sports, energetic", weakness: "Cannot sit still, very short attention span", attendance: "65%", learningStyle: "Kinesthetic", notes: "ADHD suspected, needs physical activities interspersed. Father is daily wage worker.", scores: { Math: 30, Physics: 35, Biology: 40 } },
  { id: "s12", name: "Fatima Khan", rollNo: 12, category: "Struggler", strength: "Very polite, willing to learn", weakness: "First generation learner, no help at home", attendance: "70%", learningStyle: "Visual", notes: "Comes from underprivileged background. Needs extra support and simplified materials.", scores: { Math: 28, Physics: 32, Biology: 45 } },
  { id: "s13", name: "Deepak Jatav", rollNo: 13, category: "Struggler", strength: "Street smart, practical knowledge", weakness: "Hates reading, poor writing skills", attendance: "60%", learningStyle: "Kinesthetic", notes: "Works at father's shop after school. Tired in morning classes. Give practical, hands-on tasks.", scores: { Math: 25, Physics: 30, Biology: 38 } },
  { id: "s14", name: "Sunita Kumari", rollNo: 14, category: "Struggler", strength: "Eager to prove herself", weakness: "Extreme math anxiety, freezes during tests", attendance: "75%", learningStyle: "Auditory", notes: "Needs positive reinforcement. Breaks down under pressure. One-on-one attention helps.", scores: { Math: 22, Physics: 40, Biology: 50 } },
];

// --- 4. CURRICULUM (FULL 6 TOPICS) ---
const CURRICULUM_6TH: { [key: string]: SubjectTopic[] } = {
  "Math": [
    { name: "Knowing Our Numbers", subtopics: ["Place Value", "Commas", "Estimation"], practical: "Digit Cards" },
    { name: "Whole Numbers", subtopics: ["Number Line", "Properties"], practical: "Floor Jump" },
    { name: "Playing with Numbers", subtopics: ["LCM/HCF", "Divisibility"], practical: "Pebble Groups" },
    { name: "Basic Geometry", subtopics: ["Points, Lines, Angles"], practical: "Matchstick Shapes" },
    { name: "Fractions", subtopics: ["Equivalent Fractions", "Addition"], practical: "Paper Folding" },
    { name: "Decimals", subtopics: ["Tenths, Hundredths, Money"], practical: "Fake Market" }
  ],
  "Physics": [
    { name: "Motion", subtopics: ["Types of Motion", "Speed"], practical: "Hand-span vs Ruler" },
    { name: "Light", subtopics: ["Shadows", "Reflection"], practical: "Torch Play" },
    { name: "Electricity", subtopics: ["Circuits", "Conductors"], practical: "LED & Battery" },
    { name: "Magnets", subtopics: ["Poles", "Attraction/Repulsion"], practical: "Iron Filings" },
    { name: "Force", subtopics: ["Friction", "Gravity"], practical: "Pushing Box" },
    { name: "Machines", subtopics: ["Levers", "Pulleys"], practical: "Stick Lift" }
  ],
  "Biology": [
    { name: "Food Sources", subtopics: ["Ingredients", "Animal vs Plant"], practical: "Lunchbox List" },
    { name: "Components", subtopics: ["Nutrients", "Balanced Diet"], practical: "Iodine Test" },
    { name: "Fibre to Fabric", subtopics: ["Weaving", "Spinning"], practical: "Cloth Pulling" },
    { name: "Plants", subtopics: ["Leaf Parts", "Photosynthesis"], practical: "Leaf Impression" },
    { name: "Body Movements", subtopics: ["Joints", "Skeleton"], practical: "Elbow Feel" },
    { name: "Organisms", subtopics: ["Habitats", "Adaptation"], practical: "Garden Walk" }
  ]
};

const CURRICULUM_7TH: { [key: string]: SubjectTopic[] } = {
  "Math": [
    { name: "Integers", subtopics: ["Add/Sub", "Multiplication"], practical: "Dice Game" },
    { name: "Fractions", subtopics: ["Multiplication", "Division"], practical: "Apple Cut" },
    { name: "Data", subtopics: ["Mean/Mode", "Bar Graphs"], practical: "Height Chart" },
    { name: "Equations", subtopics: ["Balancing", "Solving"], practical: "Tarazu" },
    { name: "Angles", subtopics: ["Complementary", "Supplementary"], practical: "Scissors" },
    { name: "Triangles", subtopics: ["Pythagoras", "Properties"], practical: "Paper Cut" }
  ],
  "Physics": [
    { name: "Heat", subtopics: ["Thermometer", "Conduction"], practical: "Hot/Cold Water" },
    { name: "Winds", subtopics: ["Pressure", "Storms"], practical: "Balloon Blow" },
    { name: "Motion", subtopics: ["Speed", "Distance-Time"], practical: "Pendulum" },
    { name: "Current", subtopics: ["Heating Effect", "Fuse"], practical: "Electromagnet" },
    { name: "Light", subtopics: ["Lenses", "Prism"], practical: "Spoon Reflection" },
    { name: "Sound", subtopics: ["Vibration", "Pitch"], practical: "Rubber Band" }
  ],
  "Biology": [
    { name: "Plant Nutrition", subtopics: ["Photosynthesis", "Nutrients"], practical: "Black Paper Leaf" },
    { name: "Animal Nutrition", subtopics: ["Digestion", "Enzymes"], practical: "Teeth Count" },
    { name: "Fibre", subtopics: ["Wool/Silk", "Processing"], practical: "Burning Test" },
    { name: "Respiration", subtopics: ["Lungs", "Breathing"], practical: "Chest Measure" },
    { name: "Human Heart", subtopics: ["Circulation", "Blood"], practical: "Stethoscope" },
    { name: "Reproduction", subtopics: ["Seeds", "Germination"], practical: "Flower Dissection" }
  ]
};

// --- 5. CLASS DATA WITH DETAILED STUDENT PERSONAS ---
// Instead of random generation, we use the detailed personas + filler students

const generateFillerStudents = (startId: number, count: number): Student[] => {
  const firstNames = ["Arjun", "Reyansh", "Ayaan", "Ishaan", "Kabir", "Aditya", "Vihaan", "Rudra", "Dhruv", "Lakshya", "Pooja", "Kavya", "Riya", "Divya", "Neha", "Sakshi", "Tanvi", "Shreya", "Aditi", "Bhavna"];
  const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Yadav", "Patel", "Reddy", "Kumar", "Joshi"];
  const styles: ("Visual" | "Auditory" | "Kinesthetic" | "Reading")[] = ["Visual", "Auditory", "Kinesthetic", "Reading"];

  return Array.from({ length: count }).map((_, i) => {
    const rand = Math.random();
    const category: "High Performer" | "Average" | "Struggler" = rand > 0.75 ? "High Performer" : rand < 0.15 ? "Struggler" : "Average";
    const baseScore = category === "High Performer" ? 80 : category === "Struggler" ? 35 : 60;

    return {
      id: `s${startId + i}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      rollNo: startId + i,
      category,
      strength: category === "High Performer" ? "Quick learner" : category === "Struggler" ? "Tries hard" : "Consistent",
      weakness: category === "High Performer" ? "Needs challenge" : category === "Struggler" ? "Needs extra help" : "Average effort",
      attendance: `${70 + Math.floor(Math.random() * 25)}%`,
      learningStyle: styles[Math.floor(Math.random() * styles.length)],
      notes: "",
      scores: {
        Math: baseScore + Math.floor(Math.random() * 15),
        Physics: baseScore + Math.floor(Math.random() * 15),
        Biology: baseScore + Math.floor(Math.random() * 15),
      }
    };
  });
};

export const SCHOOL_DATA: { [key: string]: ClassData } = {
  "Class 6A": {
    className: "Class 6A",
    teacherId: "t1",
    students: [...STUDENT_PERSONAS, ...generateFillerStudents(15, 36)],  // 14 detailed + 36 filler = 50
    curriculum: CURRICULUM_6TH,
    totalPeriods: 30,
    periodDurationMinutes: 40,
  },
  "Class 6B": {
    className: "Class 6B",
    teacherId: "t2",
    students: [...STUDENT_PERSONAS.slice(0, 8), ...generateFillerStudents(15, 42)],
    curriculum: CURRICULUM_6TH,
    totalPeriods: 30,
    periodDurationMinutes: 40,
  },
  "Class 7A": {
    className: "Class 7A",
    teacherId: "t3",
    students: [...STUDENT_PERSONAS.slice(4, 14), ...generateFillerStudents(15, 40)],
    curriculum: CURRICULUM_7TH,
    totalPeriods: 30,
    periodDurationMinutes: 40,
  },
  "Class 7B": {
    className: "Class 7B",
    teacherId: "t1",
    students: [...STUDENT_PERSONAS.slice(2, 12), ...generateFillerStudents(15, 40)],
    curriculum: CURRICULUM_7TH,
    totalPeriods: 30,
    periodDurationMinutes: 40,
  }
};

// --- 6. CONTEXT BUILDER FOR AI AGENT ---
// Builds a rich context string that the AI agent uses for every interaction

export function buildTeacherContext(teacherKey: string): string {
  const teacher = TEACHERS[teacherKey];
  if (!teacher) return "Teacher not found.";

  const constraints = teacher.scheduleConstraints;

  return `
=== TEACHER PROFILE ===
Name: ${teacher.name}
Age: ${teacher.age}
Qualification: ${teacher.qualification}
Experience: ${teacher.experience}
English Fluency: ${teacher.english_fluency}
Tech Comfort: ${teacher.techComfort}
Teaching Style: ${teacher.teaching_style}
Strengths: ${teacher.strength}
Weaknesses: ${teacher.weakness}
Subjects: ${teacher.subjects.join(", ")}
Classes: ${teacher.classes.join(", ")}

=== PERSONAL CONTEXT ===
${teacher.personalContext}

=== SCHEDULING CONSTRAINTS ===
Max Hours Per Day: ${constraints.maxHoursPerDay}
Preferred Time Slots: ${constraints.preferredTimeSlots.join(", ")}
Unavailable Slots: ${constraints.unavailableSlots.join(", ")}
Recurring Commitments: ${constraints.recurringCommitments.join("; ")}
Scheduling Notes: ${constraints.notes}
`.trim();
}

export function buildClassContext(className: string): string {
  const classData = SCHOOL_DATA[className];
  if (!classData) return "Class not found.";

  const highPerformers = classData.students.filter(s => s.category === "High Performer");
  const average = classData.students.filter(s => s.category === "Average");
  const strugglers = classData.students.filter(s => s.category === "Struggler");

  const detailedStudents = classData.students
    .filter(s => s.notes && s.notes.length > 0)
    .map(s => `  - ${s.name} (${s.category}): Strength: ${s.strength}. Weakness: ${s.weakness}. Learning Style: ${s.learningStyle}. Notes: ${s.notes}. Scores: Math=${s.scores.Math}, Physics=${s.scores.Physics}, Biology=${s.scores.Biology}`)
    .join("\n");

  return `
=== CLASS: ${classData.className} ===
Total Students: ${classData.students.length}
High Performers: ${highPerformers.length} students
Average: ${average.length} students
Strugglers: ${strugglers.length} students
Period Duration: ${classData.periodDurationMinutes} minutes
Total Weekly Periods: ${classData.totalPeriods}

=== KEY STUDENT PROFILES ===
${detailedStudents}

=== STRUGGLER NAMES (need extra attention) ===
${strugglers.map(s => s.name).join(", ")}

=== HIGH PERFORMER NAMES (can be peer tutors) ===
${highPerformers.map(s => s.name).join(", ")}
`.trim();
}

export function buildFullContext(teacherKey: string, className: string): string {
  return `${buildTeacherContext(teacherKey)}\n\n${buildClassContext(className)}`;
}

export function getTeacherKeyById(teacherId: string): string | undefined {
  return Object.keys(TEACHERS).find(key => TEACHERS[key].id === teacherId);
}