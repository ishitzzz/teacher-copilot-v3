import { SCHOOL_DATA, TEACHERS, Student, buildTeacherContext, buildClassContext, getTeacherKeyById } from "@/app/data";
import { NextResponse } from "next/server";
import { generateWithFailover } from "@/lib/gemini";

// --- CONFIGURATION ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- SAFETY NET IMAGES (Guaranteed to work for Demo) ---
const TOPIC_IMAGES: { [key: string]: string } = {
  "plant": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Plant_cell_structure-en.svg/1200px-Plant_cell_structure-en.svg.png",
  "leaf": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leaf_anatomy.svg/1200px-Leaf_anatomy.svg.png",
  "photosynthesis": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Photosynthesis_en.svg/1200px-Photosynthesis_en.svg.png",
  "heart": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg/1200px-Diagram_of_the_human_heart_%28cropped%29.svg.png",
  "digestive": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_en.svg/1000px-Digestive_system_diagram_en.svg.png",
  "fraction": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Fraction_1_over_4_pie.svg/1024px-Fraction_1_over_4_pie.svg.png",
  "magnet": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/MagnetEZ.svg/1200px-MagnetEZ.svg.png",
  "circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Simple_circuit.svg/1200px-Simple_circuit.svg.png",
  "gravity": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Newton_Cannon.svg/1200px-Newton_Cannon.svg.png",
  "light": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Pencil_in_a_bowl_of_water.svg/1200px-Pencil_in_a_bowl_of_water.svg.png",
  "geometry": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Triangle.Geomery.svg/1200px-Triangle.Geomery.svg.png"
};

// --- HELPER: GENERATE IMAGE WITH DALL-E 3 ---
async function generateDalleImage(prompt: string) {
  if (!OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Scientific diagram, educational textbook style, white background, high resolution, clear labels: ${prompt}`,
        n: 1,
        size: "1024x1024",
      }),
    });
    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error("OpenAI Image Error:", error);
    return null;
  }
}

const cleanJSON = (text: string) => {
  const cleanMarkdown = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleanMarkdown.indexOf("{");
  const lastBrace = cleanMarkdown.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace >= 0) return cleanMarkdown.substring(firstBrace, lastBrace + 1);
  return cleanMarkdown;
};

const cleanHTML = (text: string) => {
  return text.replace(/```html/g, "").replace(/```/g, "").trim();
};

const cleanText = (text: string) => {
  return text.trim();
};

export async function POST(req: Request) {

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "chat") {
      const { currentPlan, userQuestion, teacherId, className } = body;

      // Build context for the follow-up chat
      const teacherKey = teacherId ? getTeacherKeyById(teacherId) : "Sunita";
      const teacher = teacherKey ? TEACHERS[teacherKey] : TEACHERS["Sunita"];
      const classContext = className ? buildClassContext(className) : "";

      const result = await generateWithFailover({
        contents: [{
          role: "user", parts: [{
            text: `
          Role: 'Expert Educational Co-pilot for Indian school teachers'.
          Tone: Calm, simple, empathetic, practical.
          Rule: If input is Hindi, reply in Hinglish.

          === TEACHER CONTEXT ===
          Teacher: ${teacher.name} (${teacher.qualification}, ${teacher.experience} experience)
          Teaching Style: ${teacher.teaching_style}
          English Fluency: ${teacher.english_fluency}
          Tech Comfort: ${teacher.techComfort}
          Personal Notes: ${teacher.personalContext.slice(0, 300)}

          ${classContext ? `=== CLASS CONTEXT ===\n${classContext.slice(0, 500)}` : ""}

          === CURRENT LESSON CONTEXT ===
          Topic: "${currentPlan?.title}"
          Strategy: "${currentPlan?.strategy || ''}"
          Hook: "${currentPlan?.hook || ''}"

          === TEACHER'S QUESTION ===
          "${userQuestion}"

          Respond helpfully. Keep language simple since this teacher is ${teacher.english_fluency} in English.
          STRICT LANGUAGE RULE: ALWAYS reply in English or Hinglish. DO NOT use Hindi Devnagari script under any circumstances.
          If the teacher asks about scheduling, assignments, or tests, specifically tell them to type commands like "create a schedule for this topic" or "make a test on this" to trigger the agent.
        ` }]
        }]
      });
      return NextResponse.json({ reply: cleanText(result.response.text()) });
    }

    if (action === "plan") {
      const { query, className, subject, teacherId } = body;

      const isHeartTopic = query.toLowerCase().includes("heart") || query.toLowerCase().includes("dil");

      let visualType = "image";
      if (subject === "Math" || subject === "Physics" || query.toLowerCase().includes("motion") || query.toLowerCase().includes("force")) {
        visualType = "simulation";
      }

      const classContext = SCHOOL_DATA[className] || SCHOOL_DATA["Class 6A"];
      const teacherKey = getTeacherKeyById(teacherId) || "Sunita";
      const teacher = TEACHERS[teacherKey] || TEACHERS["Sunita"];
      const strugglers = classContext.students.filter((s: Student) => s.category === "Struggler").slice(0, 5).map((s: Student) => `${s.name} (${s.weakness})`);
      const toppers = classContext.students.filter((s: Student) => s.category === "High Performer").slice(0, 5).map((s: Student) => `${s.name} (${s.strength})`);

      const systemPrompt = `
        ACT AS: Expert Educational Co-pilot for Indian schools.
        
        === TEACHER PROFILE ===
        Name: ${teacher.name}
        Experience: ${teacher.experience}
        Teaching Style: ${teacher.teaching_style}
        English Fluency: ${teacher.english_fluency}
        Tech Comfort: ${teacher.techComfort}
        Personal Context: ${teacher.personalContext.slice(0, 200)}

        === CLASS: ${className} ===
        Total Students: ${classContext.students.length}
        Key Strugglers: ${strugglers.join("; ")}
        Key High Performers: ${toppers.join("; ")}
        
        TOPIC: "${query}" in ${subject}.

        TASK: Generate a lesson plan that fits THIS specific teacher's style and capabilities.
        
        **ADAPTATION RULES:**
        - If teacher has LOW tech comfort: Avoid tech-heavy simulations, focus on hands-on activities
        - If teacher has POOR English: Write the script in simple English mixed with Hindi suggestions
        - If there are many strugglers: Plan slower pacing, more repetition, simpler language
        - Include SPECIFIC student names in group assignments
        
        **VISUAL STRATEGY:**
        - Visual Type: "${visualType}"
        - IF 'simulation': Describe a modern HTML5/Tailwind widget.
        - IF 'image': Describe a detailed scientific diagram prompt AND extract a SINGLE LOWERCASE KEYWORD from: [plant, leaf, heart, digestive, fraction, magnet, circuit, gravity, light, geometry].
        
        **JSON OUTPUT:**
        { 
          "title": "Topic Name", 
          "subtitle": "Conceptual Summary", 
          "strategy": "Personalized strategy for ${teacher.name}", 
          "hook": "Desi Analogy that ${teacher.name} can comfortably deliver", 
          "groups": [
            {"name": "Team Seedlings (Need Nurturing)", "task": "Simple guided task", "students": "Names of specific strugglers"},
            {"name": "Team Rockets (Peer Leaders)", "task": "Advanced challenge + help others", "students": "Names of specific high performers"},
            {"name": "Team Explorers (Growing)", "task": "Standard practice", "students": "Others"}
          ], 
          "script": "A teaching script written for ${teacher.name}'s style and comfort level.", 
          "visual_type": "${visualType}",
          "visual_prompt": "The prompt description",
          "visual_keyword": "plant", 
          "isVR": ${isHeartTopic} 
        }
      `;

      const result = await generateWithFailover({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const jsonStr = cleanJSON(result.response.text());
      const planData = JSON.parse(jsonStr);

      // *** IMAGE RESOLUTION ***
      if (planData.visual_type === "image") {
        // 1. Try Safety Net First
        if (planData.visual_keyword) {
          const key = planData.visual_keyword.toLowerCase();
          if (TOPIC_IMAGES[key]) planData.visual_url = TOPIC_IMAGES[key];
        }
        // 2. Try DALL-E
        if (!planData.visual_url && OPENAI_API_KEY) {
          const dalleUrl = await generateDalleImage(planData.visual_prompt);
          if (dalleUrl) planData.visual_url = dalleUrl;
        }
        // 3. Placeholder
        if (!planData.visual_url) {
          planData.visual_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Science_icon.svg/1024px-Science_icon.svg.png";
        }
      }

      return NextResponse.json(planData);
    }

    if (action === "simulation") {
      const { simulation_prompt } = body;
      const codePrompt = `
        YOU ARE A SENIOR FRONTEND ENGINEER.
        TASK: Build a Single-File HTML5 Interactive Widget for: "${simulation_prompt}".
        RULES: Plain HTML + Vanilla JS + Tailwind CSS (CDN). Dark Mode ('bg-slate-900').
        OUTPUT: Only raw HTML string starting with <!DOCTYPE html>.
      `;
      const result = await generateWithFailover({ contents: [{ role: "user", parts: [{ text: codePrompt }] }] });
      return NextResponse.json({ code: cleanHTML(result.response.text()) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SERVER ERROR:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}