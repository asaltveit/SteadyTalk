# SteadyTalk
SteadyTalk is an emotionally intelligent AI manager designed for live performance conversations via video, built entirely from scratch. It features a realistic engineering lead avatar powered by Tavus, whose responses are dynamically guided by a real-time emotion detection model. When user sentiment shifts negatively (sad, angry, overwhelmed), the agent pauses and de-escalates, capable of invoking a `get_inspiration(text)` tool utilizing Redis vector search over curated motivational quotes. Conversely, positive sentiment elicits organic encouragement. A critical component is the TypeScript webhook that captures Tavus' `transcription_ready` events, streaming full transcripts directly into n8n to automatically trigger downstream workflows like follow-up emails or analytics processing, making this solution humane, scalable, and plug-and-play for team coaching.

Uses fal, ElevenLabs, Tavus, n8n.

Created by Anna Saltveit and Patrick Damaso for the ElevenLabs Worldwide hackathon 12/11.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
