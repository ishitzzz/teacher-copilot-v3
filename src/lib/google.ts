import { google } from 'googleapis';
import path from 'path';

// Authenticate using the service account key file
// The file 'service-account.json' must be in the project root
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive',
];

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'service-account.json'),
    scopes: SCOPES,
});

export const calendar = google.calendar({ version: 'v3', auth });
export const docs = google.docs({ version: 'v1', auth });
export const drive = google.drive({ version: 'v3', auth });

// --- IMPORTANT FOLDER AND CALENDAR IDs ---
// These should be set in .env.local. If missing, it tries to use the Service Account's 
// isolated quota, which will throw "Storage Quota Exceeded" or invisible calendar errors.
const SHARED_FOLDER_ID = (process.env.GOOGLE_DRIVE_FOLDER_ID || "").trim();
const SHARED_CALENDAR_ID = (process.env.GOOGLE_CALENDAR_ID || "primary").trim();

// --- Calendar Helpers ---

export interface CalendarEvent {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
}

export async function listUpcomingEvents(maxResults = 10) {
    try {
        const res = await calendar.events.list({
            calendarId: SHARED_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return res.data.items;
    } catch (error: any) {
        console.error('Error fetching calendar events:', error?.message);
        throw new Error('Failed to fetch calendar events. Ensure the exact calendar ID is shared with the service account.');
    }
}

export async function createCalendarEvent(event: CalendarEvent) {
    try {
        const res = await calendar.events.insert({
            calendarId: SHARED_CALENDAR_ID,
            requestBody: event,
        });
        return res.data;
    } catch (error: any) {
        console.error('Error creating calendar event:', error?.message);
        throw new Error('Failed to create event. Ensure the exact calendar ID is shared with the service account.');
    }
}

// --- Docs Helpers (Now Using Apps Script Bridge) ---

export async function createDocument(title: string, content: string) {
    try {
        const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

        if (!scriptUrl) {
            throw new Error("Missing GOOGLE_APPS_SCRIPT_URL in .env.local!");
        }

        console.log("🚀 Sending request to Apps Script bridge...", { title });

        const response = await fetch(scriptUrl, {
            method: "POST",
            // Note: Google Apps Script Web Apps require cors mode or no-cors with text/plain
            // in some environments, but server-side fetch usually avoids preflight issues.
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title,
                content: content
            }),
        });

        // Some Apps Script deployments return redirects (302) before the final payload
        // fetch handles this automatically on Node.
        const data = await response.json();

        if (data.error) {
            throw new Error(`Apps Script Error: ${data.error}`);
        }

        if (!data.url) {
            throw new Error("Failed to retrieve document URL from Apps Script");
        }

        console.log("✅ Received Doc URL from bridge:", data.url);
        return data.url;

    } catch (error: any) {
        console.error('Error creating Google Doc via Bridge:', error?.message);
        throw new Error(`Failed to create Google Doc: ${error?.message}`);
    }
}
