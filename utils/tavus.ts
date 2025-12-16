/**
 * Tavus API utilities for creating personas and conversations
 */

const TAVUS_BASE_URL = 'https://tavusapi.com/v2';
const DEFAULT_REPLICA_ID = 'r92debe21318';
const LLM_MODEL = 'tavus-gpt-4o';
const PERCEPTION_MODEL = 'raven-0';
const TTS_ENGINE = 'elevenlabs';

/**
 * Small helper for POSTing to Tavus with better debug output on 4xx/5xx.
 */
async function postJson(endpoint: string, payload: Record<string, any>): Promise<any> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY is not set in environment variables.');
  }

  const url = `${TAVUS_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
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
 * Build the JSON payload for Tavus /v2/personas.
 */
export function buildEngineeringManagerPersonaPayload(
  scenarioKey: string = 'pip_swe',
  systemPrompt: string
): Record<string, any> {
  const payload = {
    persona_name: `Jordan – Performance Conversation`,
    pipeline_mode: 'full',
    system_prompt: systemPrompt,
    context:
      'You are an engineering manager holding a difficult 1:1 performance conversation. ' +
      'The goal is to clarify performance expectations, explain where the employee has fallen short, ' +
      'and walk them through a Performance Improvement Plan (PIP) with empathy and clarity. ' +
      'You expect them to start off sounding casual, but you rely on Raven-0 perception signals ' +
      'to notice when they become sad, tearful, angry, or shut down so you can slow down, ' +
      'empathize, and de-escalate. When the user is deeply down or angry, you may call the ' +
      '`find_inspiration` tool to pull short, relevant words of wisdom to integrate into your coaching.',
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
      },

      // ---------- TTS layer ----------
      tts: {
        tts_engine: TTS_ENGINE,
      },

      // ---------- STT layer (Tavus Advanced style) ----------
      stt: {
        participant_pause_sensitivity: 'medium',
        participant_interrupt_sensitivity: 'medium',
        smart_turn_detection: true,
      },

      // ---------- Perception layer (Raven-0) ----------
      perception: {
        perception_model: PERCEPTION_MODEL,
        ambient_awareness_queries: [
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

/**
 * Create the Tavus persona via /v2/personas.
 *
 * Returns the JSON response (including persona_id) that you should persist
 * and reuse for subsequent conversations.
 */
export async function createPersona(systemPrompt: string): Promise<any> {
  const payload = buildEngineeringManagerPersonaPayload('pip_swe', systemPrompt);
  const data = await postJson('personas', payload);
  console.log('Created persona:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Spin up a CVI conversation for this persona.
 *
 * If persona has default_replica_id set (which it does), replica_id can be omitted.
 */
export async function createConversation(
  personaId: string,
  replicaId: string | null = null
): Promise<any> {
  const body: Record<string, any> = {
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
