import { NextRequest, NextResponse } from 'next/server';
import { listUpcomingEvents, createCalendarEvent, createDocument, CalendarEvent } from '@/lib/google';
import { getAvailableClient, markSlotCooldown } from '@/lib/gemini';
import {
    TEACHERS, SCHOOL_DATA,
    buildTeacherContext, buildClassContext, buildFullContext, getTeacherKeyById
} from '@/app/data';

// ====================================================================
// AGENTIC AI ROUTE — FULL FUNCTION-CALLING WITH RICH CONTEXT
// ====================================================================
// This route:
//   1. Receives a user message + teacher/class context
//   2. Injects FULL teacher profile, student personas, schedule constraints
//   3. Uses Gemini function calling to decide WHICH tool to use
//   4. Executes the tool (Google Calendar, Docs, etc.)
//   5. Returns the result back to Gemini for a human-friendly response
// ====================================================================

// --- FUNCTION DECLARATIONS FOR GEMINI ---
const tools: any = [
    {
        functionDeclarations: [
            {
                name: "check_schedule",
                description: "Check the teacher's Google Calendar for upcoming classes, events, and appointments. Use this when the teacher wants to see their schedule, upcoming events, or check availability.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        limit: {
                            type: "NUMBER",
                            description: "Number of upcoming events to fetch (default 10)"
                        }
                    },
                },
            },
            {
                name: "create_schedule",
                description: "Create one or more calendar events for the teacher. Use this when asked to create a lecture schedule, schedule a lecture plan, timetable, class schedule, or plan a series of classes/lectures on a topic. IMPORTANT: Consider the teacher's personal constraints, unavailable slots, max hours per day, and recurring commitments when creating the schedule.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        events: {
                            type: "ARRAY",
                            description: "Array of calendar events to create",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    summary: { type: "STRING", description: "Title of the event/class" },
                                    description: { type: "STRING", description: "Detailed description including topics, activities, student grouping" },
                                    startDateTime: { type: "STRING", description: "ISO 8601 start time, e.g. 2026-02-24T09:00:00+05:30" },
                                    endDateTime: { type: "STRING", description: "ISO 8601 end time, e.g. 2026-02-24T09:40:00+05:30" },
                                },
                                required: ["summary", "description", "startDateTime", "endDateTime"]
                            }
                        },
                        rationale: {
                            type: "STRING",
                            description: "Explain WHY you chose these specific days/times considering the teacher's constraints"
                        }
                    },
                    required: ["events", "rationale"]
                }
            },
            {
                name: "create_assignment_doc",
                description: "Create a homework assignment or worksheet in Google Docs. Consider the student profiles — include differentiated tasks for high performers, average students, and strugglers. Adjust language complexity based on the teacher's English fluency.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING", description: "Title of the assignment document" },
                        content: { type: "STRING", description: "The full text content of the assignment. Include differentiated sections for different student levels." }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "create_test_doc",
                description: "Create a test or exam paper in Google Docs. Include questions of varying difficulty — easy for strugglers, medium for average, and challenging for high performers. Consider the teacher's preferred assessment style.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING", description: "Title of the test paper" },
                        content: { type: "STRING", description: "The full test paper content with sections, marks, and instructions. Include answer key if requested." },
                        totalMarks: { type: "NUMBER", description: "Total marks for the test" },
                        duration: { type: "STRING", description: "Duration of the test, e.g. '40 minutes'" }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "create_lecture_plan_doc",
                description: "Create a detailed lecture script or lesson notes document in Google Docs. Use this ONLY when asked to write out the detailed textual script, activities, and notes for a single class (NOT for scheduling dates/times).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING", description: "Title of the lecture plan" },
                        content: { type: "STRING", description: "Complete lecture plan with timing, activities, script, and differentiated tasks" }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "get_teacher_info",
                description: "Retrieve detailed information about a specific teacher's profile, constraints, and schedule. Use this when you need to look up information about another teacher for coordination.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        teacherName: { type: "STRING", description: "Name or key of the teacher to look up (e.g., 'Sunita', 'Rajesh', 'Anjali')" }
                    },
                    required: ["teacherName"]
                }
            }
        ]
    }
];

// Max retries across all available API key slots
const MAX_RETRIES = 6;

export async function POST(req: NextRequest) {
    const { userMessage, teacherKey, className } = await req.json();

    // --- BUILD RICH CONTEXT ---
    const effectiveTeacherKey = teacherKey || "Sunita";
    const effectiveClassName = className || "Class 6A";

    const teacher = TEACHERS[effectiveTeacherKey];
    const fullContext = buildFullContext(effectiveTeacherKey, effectiveClassName);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // --- SYSTEM INSTRUCTION ---
    const systemInstruction = `
You are an intelligent AI teaching assistant for Indian school teachers. You help teachers with scheduling, creating assignments, tests, lecture plans, and answering questions about their classes.

TODAY'S DATE AND TIME: ${dateStr}, ${timeStr}
TIMEZONE: Asia/Kolkata (IST, +05:30)

=== CURRENT TEACHER CONTEXT ===
${fullContext}

=== IMPORTANT RULES ===
1. ALWAYS consider the teacher's personal constraints when scheduling:
   - Check their unavailable slots, max hours per day, and recurring commitments
   - Never schedule during their blocked times
   - Respect their preferred time slots
   
2. When answering about "LECTURE PLANS" vs "SCHEDULES":
   - IF the teacher asks to "plan a lecture", "create a lecture plan", or "schedule classes": Use the \`create_schedule\` tool to add events to their Google Calendar.
   - IF the teacher asks to "write the script", "draft the notes", or "create a lesson plan document": Use the \`create_lecture_plan_doc\` tool to create a Google Doc.

3. When creating ASSIGNMENTS or TESTS:
   - Include differentiated content (easy/medium/hard sections)
   - Name specific students in suggestions (e.g., "Aarav can try the bonus section")

4. TONE: Be warm, respectful, and practical. Address the teacher as "${teacher?.name || 'Teacher'}" or "Ma'am/Sir".

5. LANGUAGE RULE (STRICT): 
   - ALWAYS generate ALL content (Calendar titles, assignments, notes, chat responses) in English or Hinglish by default. 
   - DO NOT generate pure Hindi script (Devanagari) unless the teacher explicitly asks for it in that specific prompt.
   - If the teacher asks questions in Hindi or Hinglish, reply back in Hinglish (using English alphabet).
   
6. When you create any document or event, explain what you did and why in your chat reply.
`;

    let lastError: any = null;

    // Try up to MAX_RETRIES times across different API key slots
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { client, modelName, label } = getAvailableClient();

        try {
            console.log(`🔄 Agent: Trying ${label} (attempt ${attempt + 1})...`);

            const model = client.getGenerativeModel({
                model: modelName,
                tools: tools,
                systemInstruction: systemInstruction,
            });

            const chat = model.startChat();

            // 1. Send user message to Gemini
            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            const calls = response.functionCalls();

            if (calls && calls.length > 0) {
                const firstCall = calls[0];
                console.log(`🔧 Agent: Function call → ${firstCall.name} `, JSON.stringify(firstCall.args).slice(0, 200));

                // --- HANDLE FUNCTION CALLS ---

                if (firstCall.name === "check_schedule") {
                    const limit = (firstCall.args as any)?.limit || 10;
                    let events;
                    try {
                        events = await listUpcomingEvents(limit);
                    } catch (e) {
                        // If calendar fails, return a helpful message
                        const functionResponse = {
                            functionResponse: {
                                name: "check_schedule",
                                response: { error: "Calendar access failed. The service account may not have access to this calendar.", events: [] }
                            }
                        };
                        const finalResult = await chat.sendMessage([functionResponse]);
                        return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "check_schedule", status: "error" });
                    }

                    const functionResponse = {
                        functionResponse: {
                            name: "check_schedule",
                            response: { events: events || [] }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Success on ${label} `);
                    return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "check_schedule" });
                }

                if (firstCall.name === "create_schedule") {
                    const { events: eventsList, rationale } = firstCall.args as {
                        events: Array<{ summary: string; description: string; startDateTime: string; endDateTime: string }>;
                        rationale: string;
                    };

                    const createdEvents: any[] = [];
                    const failedEvents: any[] = [];

                    for (const evt of eventsList) {
                        try {
                            const calEvent: CalendarEvent = {
                                summary: evt.summary,
                                description: evt.description,
                                start: { dateTime: evt.startDateTime },
                                end: { dateTime: evt.endDateTime },
                            };
                            const result = await createCalendarEvent(calEvent);
                            createdEvents.push({ summary: evt.summary, start: evt.startDateTime, id: result.id });
                        } catch (e) {
                            failedEvents.push({ summary: evt.summary, error: String(e) });
                        }
                    }

                    const functionResponse = {
                        functionResponse: {
                            name: "create_schedule",
                            response: {
                                createdEvents,
                                failedEvents,
                                totalCreated: createdEvents.length,
                                totalFailed: failedEvents.length,
                                rationale,
                            }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Created ${createdEvents.length} events on ${label} `);
                    return NextResponse.json({
                        reply: finalResult.response.text(),
                        actionPerformed: "create_schedule",
                        createdEvents,
                        failedEvents,
                    });
                }

                if (firstCall.name === "create_assignment_doc") {
                    const { title, content } = firstCall.args as { title: string; content: string };
                    let docUrl;
                    try {
                        docUrl = await createDocument(title, content);
                    } catch (e) {
                        const functionResponse = {
                            functionResponse: {
                                name: "create_assignment_doc",
                                response: { error: `Failed to create document: ${String(e)} `, status: "error" }
                            }
                        };
                        const finalResult = await chat.sendMessage([functionResponse]);
                        return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_doc", status: "error" });
                    }

                    const functionResponse = {
                        functionResponse: {
                            name: "create_assignment_doc",
                            response: { url: docUrl, status: "success" }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Created assignment doc on ${label} `);
                    return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_doc", docUrl });
                }

                if (firstCall.name === "create_test_doc") {
                    const { title, content } = firstCall.args as { title: string; content: string };
                    let docUrl;
                    try {
                        docUrl = await createDocument(title, content);
                    } catch (e) {
                        const functionResponse = {
                            functionResponse: {
                                name: "create_test_doc",
                                response: { error: `Failed to create test document: ${String(e)} `, status: "error" }
                            }
                        };
                        const finalResult = await chat.sendMessage([functionResponse]);
                        return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_test", status: "error" });
                    }

                    const functionResponse = {
                        functionResponse: {
                            name: "create_test_doc",
                            response: { url: docUrl, status: "success" }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Created test doc on ${label} `);
                    return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_test", docUrl });
                }

                if (firstCall.name === "create_lecture_plan_doc") {
                    const { title, content } = firstCall.args as { title: string; content: string };
                    let docUrl;
                    try {
                        docUrl = await createDocument(title, content);
                    } catch (e) {
                        const functionResponse = {
                            functionResponse: {
                                name: "create_lecture_plan_doc",
                                response: { error: `Failed to create lecture plan: ${String(e)} `, status: "error" }
                            }
                        };
                        const finalResult = await chat.sendMessage([functionResponse]);
                        return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_lecture_plan", status: "error" });
                    }

                    const functionResponse = {
                        functionResponse: {
                            name: "create_lecture_plan_doc",
                            response: { url: docUrl, status: "success" }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Created lecture plan on ${label} `);
                    return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "create_lecture_plan", docUrl });
                }

                if (firstCall.name === "get_teacher_info") {
                    const { teacherName } = firstCall.args as { teacherName: string };
                    const teacherData = TEACHERS[teacherName];
                    const info = teacherData
                        ? buildTeacherContext(teacherName)
                        : `Teacher "${teacherName}" not found.Available teachers: ${Object.keys(TEACHERS).join(", ")} `;

                    const functionResponse = {
                        functionResponse: {
                            name: "get_teacher_info",
                            response: { info }
                        }
                    };
                    const finalResult = await chat.sendMessage([functionResponse]);
                    console.log(`✅ Agent: Retrieved teacher info on ${label} `);
                    return NextResponse.json({ reply: finalResult.response.text(), actionPerformed: "get_teacher_info" });
                }
            }

            // Normal Text Response (no function call needed)
            console.log(`✅ Agent: Success(text response) on ${label} `);
            return NextResponse.json({ reply: response.text() });

        } catch (error: any) {
            const errMsg = error?.message || String(error);
            console.warn(`❌ Agent: ${label} failed: ${errMsg.slice(0, 200)} `);
            markSlotCooldown(label);
            lastError = error;
            // Continue to next attempt with a different slot
        }
    }

    // All retries exhausted
    console.error("Agent: All model slots failed.", lastError);
    return NextResponse.json(
        { error: "Agent failed to process request. All API keys exhausted." },
        { status: 500 }
    );
}
