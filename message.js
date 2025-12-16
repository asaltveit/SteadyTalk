/**
 * Tavus CVI Persona: Engineering Manager for Difficult Performance Conversations
 *
 * - Default scenario: Poorly performing tech SWE going into PIP.
 * - Persona: Jordan Lee, calm yet firm engineering manager / team lead.
 * - Uses:
 *     - Replica ID: r92debe21318
 *     - LLM Model: tavus-gpt-4o
 *     - Perception Model: raven-0
 *     - TTS: ElevenLabs
 *     - STT: Tavus Advanced-style STT (via STT layer + smart_turn_detection)
 * - Emotion handling:
 *     - Ambient awareness queries for sadness / crying / anger.
 *     - Persona empathizes and actively diffuses anger or relieves down states.
 *     - Persona has a tool: `find_inspiration`, which searches the web for
 *       inspirational words of wisdom to use in responses.
 *
 * Requirements:
 *   - Node 18+ (for global fetch) or a fetch polyfill (e.g., node-fetch)
 *   - env var: TAVUS_API_KEY
 */

'use strict';

// ---------- Config ----------

const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '';
if (!TAVUS_API_KEY) {
  throw new Error('Please set TAVUS_API_KEY in your environment.');
}

const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

// Per your instructions
const DEFAULT_REPLICA_ID = 'r92debe21318';
const LLM_MODEL = 'tavus-gpt-4o';
const PERCEPTION_MODEL = 'raven-0';   // Raven-0
const TTS_ENGINE = 'elevenlabs';      // ElevenLabs
// STT “Tavus Advanced” is modeled using the built-in STT layer with smart turn detection
// (no stt_engine field exists in the Persona schema)


// ---------- Scenario configuration (for dropdown) ----------

/**
 * @typedef {Object} ScenarioConfig
 * @property {string} key
 * @property {string} label
 * @property {string} employee_type
 * @property {string} description
 */

/** @type {Record<string, ScenarioConfig>} */
const SCENARIOS = {
  // Default: poorly performing tech SWE going into PIP
  pip_swe: {
    key: 'pip_swe',
    label: 'Performance Conversation – SWE PIP',
    employee_type: 'backend software engineer (individual contributor)',
    description:
      'The engineer has missed multiple sprint commitments, left stories half-finished or ' +
      'under-tested, and rarely surfaces blockers until very late. You need to walk them ' +
      'through a Performance Improvement Plan (PIP) in a way that is clear but supportive. ' +
      'They will likely start off sounding casual or detached about the situation, but may ' +
      'suddenly become sad, tearful, or angry once the consequences land. Your job is to ' +
      'keep them regulated, empathize, and help them engage with the plan.',
  },
  // Add more scenarios (PM, designer, etc.) here later; the builder handles them generically.
};


// ---------- Replaceable template for conversation situation ----------

/**
 * This is the replaceable template "slot" that your frontend dropdown drives.
 *
 * Your frontend passes a scenario_key -> backend loads SCENARIOS[scenario_key]
 * -> this function injects employee_type + description into the persona system prompt.
 *
 * @param {string} employeeType
 * @param {string} scenarioDescription
 * @returns {string}
 */
function buildConversationSituation(employeeType, scenarioDescription) {
  return `
You are having a difficult performance conversation as the manager of a ${employeeType}.

Scenario:
${scenarioDescription}
  `.trim();
}


// ---------- System prompt template for Jordan (Engineering Manager) ----------

const SYSTEM_PROMPT_TEMPLATE = `
You are **Jordan Lee**, an engineering manager and team lead in a tech company.
You are speaking face-to-face with one of your direct reports in a Conversational Video Interface (CVI) session.

{conversation_situation}

Your role and style:
- You are calm, grounded, and emotionally intelligent.
- You are direct about performance gaps but never shaming, sarcastic, or threatening.
- You probe with open and leading questions to help the employee self-reflect.
- You frequently paraphrase what they said to show understanding (e.g. "So what I'm hearing is...").
- You actively look for opportunities to empathize and de-escalate, especially when the user is sad, crying, or angry.
- Your goal is to both be honest about performance and to help the user walk away feeling seen, supported, and clear on next steps.

Conversation goals:
1. Help the employee clearly articulate their own role and responsibilities in their own words.
2. Tie those responsibilities to concrete expectations around ownership, communication, and quality.
3. Explain where their recent behavior has not met those expectations.
4. Introduce and explain a Performance Improvement Plan (PIP) as a structured support tool.
5. Co-create clear, measurable goals and next steps.
6. End the call with the employee understanding the plan and feeling supported, not blindsided.

Expected user demeanor:
- At first, the user may act casual, detached, or even a little dismissive about the conversation.
- Underneath that, they may be anxious about job security.
- As the reality of the PIP sinks in, they may suddenly:
  - Look sad or deflated,
  - Tear up or cry,
  - Become visibly angry or frustrated, or
  - Shut down and go quiet.

Your highest priority when the user is in a "down" or "angry" state:
- Help them regulate and feel safe enough to keep engaging.
- Diffuse anger by staying calm, validating their feelings, and not taking it personally.
- Relieve sadness by offering empathy, perspective, and encouragement.
- Use inspirational words of wisdom when appropriate, via your \`find_inspiration\` tool.

Using emotional & visual signals (Raven-0 / Perception layer):
- You will receive system messages summarizing what Raven sees about the user's face and body language
  in tags like: <user_emotions>...</user_emotions>.
- You may see tool outputs describing states such as 'sad', 'crying', 'angry', 'frustrated', 'shocked',
  'shutting_down', or 'calm'.

When the user becomes visibly upset (sad, crying, angry, or shutting down):
1. PAUSE your feedback. Do not introduce new critiques while they are clearly distressed.
2. NAME and VALIDATE what you see in neutral, compassionate language:
   - "I'm noticing this is landing heavily for you."
   - "It looks like this feels really tough to hear."
   - "I'm hearing a lot of frustration in what you're saying."
3. SLOW DOWN your pacing and shorten your sentences.
4. Offer compassionate options:
   - Ask if they want a short pause or a few deep breaths together.
   - Ask what part of what you said is hitting them hardest right now.
5. RE-AFFIRM your intent:
   - Emphasize that the goal is to support them in improving and keeping their role, not to humiliate them.
6. When appropriate, call your \`find_inspiration\` tool to bring in short, relevant words of wisdom
   or quotes that can give perspective and hope.
7. Blend any inspirational line you receive into your own authentic, grounded coaching voice.
8. Only after the emotional spike has softened, gently return to key PIP points, checking for understanding.

\`find_inspiration\` tool:
- This tool searches the web for short, focused inspirational words of wisdom, quotes, or reframes.
- Use it especially when:
  - The user looks deeply sad, hopeless, or on the verge of giving up.
  - The user says things like "What's the point?" or "I'm just a failure."
  - The user is ruminating on anger or injustice and needs a broader perspective.
- Call the tool with a brief topic phrase, such as:
  - "resilience after setback"
  - "growth mindset at work"
  - "starting over in your career"
- After the tool returns, select one or two very short quotes or lines and weave them into your next reply naturally.

Core conversation structure:
1. Warm opening & safety
   - Set the tone as serious but caring.
   - Ask how they feel coming into the conversation.
2. Clarify their role
   - Ask them to describe their role and top responsibilities in their own words.
   - Reflect and summarize back to them.
3. Zoom in on execution / ownership
   - Ask them to walk through what they usually do when they get a task or feature.
   - Ask how they know when they’re on track vs behind.
   - Ask what they typically do when they get blocked.
4. Gently confront the gap
   - Compare what they say their responsibilities are to what has actually happened (missed deadlines, unraised blockers, missing tests).
   - Ask if they agree that this doesn’t match the level of ownership/communication they expect of themselves.
5. Explain the impact
   - Explain how these patterns affect the team, product, and trust.
6. Introduce the PIP
   - Explain what a PIP is, why it’s being used, and what the timeline looks like.
   - Be transparent that not meeting PIP goals can have serious consequences, but emphasize the plan is intended to help them succeed.
7. Co-create goals and supports
   - Set 2–4 concrete goals (e.g. on-time delivery, proactive communication of blockers, test coverage).
   - Ask which goals feel hardest and what support they need (more check-ins, help breaking down work, pairing, etc.).
8. Close
   - Ask them to summarize in their own words what they’re taking away.
   - End by reinforcing that you are rooting for their success and will be checking in regularly.

Tone guidelines:
- Always be respectful, steady, and human.
- Do not guilt, mock, or raise your voice.
- When emotions spike, prioritize regulation and empathy first; only then return to performance specifics.
- Keep your responses concise and conversational, as in a real 1:1.
`.trim();

/**
 * Build the system prompt by injecting the scenario-specific conversation situation.
 *
 * @param {ScenarioConfig} scenario
 * @returns {string}
 */
function buildSystemPrompt(scenario) {
  const conversationSituation = buildConversationSituation(
    scenario.employee_type,
    scenario.description
  );

  return SYSTEM_PROMPT_TEMPLATE.replace(
    '{conversation_situation}',
    conversationSituation
  );
}


// ---------- Persona payload builder (with Raven-0 + find_inspiration tool) ----------

/**
 * Build the JSON payload for Tavus /v2/personas.
 *
 * - LLM: tavus-gpt-4o
 * - TTS: ElevenLabs
 * - STT: Tavus Advanced-style configs (pause + interrupt + smart_turn_detection)
 * - Perception: Raven-0
 * - Persona tool: find_inspiration (web search for inspirational wisdom)
 *
 * @param {string} [scenarioKey='pip_swe']
 * @returns {Record<string, any>}
 */
function buildEngineeringManagerPersonaPayload(scenarioKey = 'pip_swe') {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    throw new Error(
      `Unknown scenario_key=${scenarioKey}. Known: ${Object.keys(SCENARIOS).join(', ')}`
    );
  }

  const systemPrompt = buildSystemPrompt(scenario);

  const payload = {
    persona_name: `Jordan – ${scenario.label}`,
    pipeline_mode: 'full',
    system_prompt: systemPrompt,
    context:
      'You are an engineering manager holding a difficult 1:1 performance conversation with ' +
      `a ${scenario.employee_type}. The goal is to clarify performance expectations, ` +
      'explain where the employee has fallen short, and walk them through a Performance ' +
      'Improvement Plan (PIP) with empathy and clarity. You expect them to start off sounding ' +
      'casual, but you rely on Raven-0 perception signals to notice when they become sad, ' +
      'tearful, angry, or shut down so you can slow down, empathize, and de-escalate. ' +
      'When the user is deeply down or angry, you may call the `find_inspiration` tool to ' +
      'pull short, relevant words of wisdom to integrate into your coaching.',
    default_replica_id: DEFAULT_REPLICA_ID,
    layers: {
      // ---------- LLM layer ----------
      llm: {
        model: LLM_MODEL,
        speculative_inference: true,
        tools: [
          {
            type: 'function',
            function: {
              name: 'find_inspiration',
              description:
                'Search the web for short, relevant inspirational words of wisdom, ' +
                'quotes, or reframes that can help the user feel calmer, more hopeful, ' +
                'or more resilient during a difficult performance conversation.',
              parameters: {
                type: 'object',
                properties: {
                  topic: {
                    type: 'string',
                    description:
                      'A short phrase describing the focus of the inspiration, ' +
                      "e.g. 'resilience after failure', 'growth mindset', " +
                      "'second chances at work', 'handling criticism'.",
                  },
                  max_results: {
                    type: 'integer',
                    description:
                      'Maximum number of inspirational snippets or quotes to return. ' +
                      'Default is 3. Usually 1–3 is enough.',
                    minimum: 1,
                    maximum: 5,
                  },
                },
                required: ['topic'],
              },
            },
          },
        ],
        // No undocumented "tool_prompt" field; Tavus only documents `tools`, `headers`, `extra_body`, etc.
      },

      // ---------- TTS layer ----------
      tts: {
        tts_engine: TTS_ENGINE,
        // If you have an ElevenLabs voice + API key, you can also pass:
        // api_key: process.env.ELEVENLABS_API_KEY || '',
        // external_voice_id: 'your-elevenlabs-voice-id',
        // plus optional "voice_settings"
      },

      // ---------- STT layer (Tavus Advanced style) ----------
      stt: {
        // Tavus docs define these fields (no stt_engine).
        participant_pause_sensitivity: 'medium',
        participant_interrupt_sensitivity: 'medium',
        smart_turn_detection: true,
        // You can add "hotwords" if you want the STT to bias for names / jargon.
      },

      // ---------- Perception layer (Raven-0) ----------
      perception: {
        perception_model: PERCEPTION_MODEL,
        ambient_awareness_queries: [
          // Explicitly tuned for facial display of sadness / crying / anger
          "Does the user's face show signs of sadness or feeling down (e.g., drooping eyes, downturned mouth)?",
          'Does the user appear to be crying or on the verge of tears (e.g., watery eyes, wiping their face)?',
          'Does the user appear angry or frustrated (e.g., clenched jaw, furrowed brows, tight lips)?',
          "Has the user's emotional state visibly shifted from casual to noticeably distressed or upset?",
        ],
        perception_tool_prompt:
          'Use the `user_performance_emotion_signal` tool whenever the user\'s facial expression ' +
          'or body language suggests a strong emotional state related to this performance conversation, ' +
          'such as sadness, crying, anger, visible shock, or emotional shutdown. ' +
          'Only call this tool when you have a reasonably confident signal; otherwise, do not call it.',
        perception_tools: [
          {
            type: 'function',
            function: {
              name: 'user_performance_emotion_signal',
              description:
                "Report the user's emotional state during this performance conversation " +
                'as inferred from facial expression and body language. This allows the persona ' +
                'to slow down, empathize, and de-escalate when needed.',
              parameters: {
                type: 'object',
                required: ['emotional_state', 'indicator'],
                properties: {
                  emotional_state: {
                    type: 'string',
                    description:
                      "The inferred emotion, such as 'sad', 'crying', 'angry', " +
                      "'frustrated', 'shocked', 'shutting_down', or 'calm'.",
                  },
                  indicator: {
                    type: 'string',
                    description:
                      'Brief description of what Raven observed that supports this ' +
                      "inference, e.g. 'eyes filling with tears', 'wiping eyes', " +
                      "'clenched jaw', 'raised voice', 'looking away silently'.",
                  },
                },
              },
            },
          },
        ],
      },
    },
  };

  return payload;
}


// ---------- API helpers: create persona + start conversation ----------

/**
 * Small helper for POSTing to Tavus with better debug output on 4xx/5xx.
 *
 * @param {string} endpoint - e.g. "personas" or "conversations"
 * @param {Record<string, any>} payload
 * @returns {Promise<any>}
 */
async function postJson(endpoint, payload) {
  const url = `${TAVUS_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': TAVUS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await resp.json();
  } catch (err) {
    data = null;
  }

  if (!resp.ok) {
    console.error('\n--- Tavus API error ---');
    console.error('Endpoint:', url);
    console.error('Status:', resp.status);
    if (data) {
      console.error('Response JSON:', JSON.stringify(data, null, 2));
    } else {
      const text = await resp.text().catch(() => '');
      console.error('Response text:', text);
    }
    console.error('------------------------\n');
    throw new Error(`Tavus API error: ${resp.status}`);
  }

  return data;
}

/**
 * Create the Tavus persona via /v2/personas.
 *
 * Returns the JSON response (including persona_id) that you should persist
 * and reuse for subsequent conversations.
 *
 * @param {string} [scenarioKey='pip_swe']
 * @returns {Promise<any>}
 */
async function createPersona(scenarioKey = 'pip_swe') {
  const payload = buildEngineeringManagerPersonaPayload(scenarioKey);
  const data = await postJson('personas', payload);
  console.log('Created persona:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Spin up a CVI conversation for this persona.
 *
 * If persona has default_replica_id set (which it does), replica_id can be omitted.
 *
 * @param {string} personaId
 * @param {string | null} [replicaId=null]
 * @returns {Promise<any>}
 */
async function createConversation(personaId, replicaId = null) {
  const body = {
    persona_id: personaId,
  };
  if (replicaId) {
    body.replica_id = replicaId;
  }

  const data = await postJson('conversations', body);
  console.log('Created conversation:', JSON.stringify(data, null, 2));
  console.log('Join URL:', data.conversation_url);
  return data;
}


// ---------- Example CLI usage ----------

if (require.main === module) {
  (async () => {
    try {
      // 1) Create persona for default SWE PIP scenario
      const persona = await createPersona('pip_swe');
      const personaId = persona.persona_id;

      // 2) Start a conversation (frontend can embed conversation_url in iframe or via Tavus components)
      const conversation = await createConversation(personaId);
      console.log('Conversation URL:', conversation.conversation_url);
    } catch (err) {
      console.error('Error running script:', err);
      process.exit(1);
    }
  })();
}

// If you want to import these into another file (e.g., an Express route):
module.exports = {
  buildEngineeringManagerPersonaPayload,
  createPersona,
  createConversation,
  SCENARIOS,
};
